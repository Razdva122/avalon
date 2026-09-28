#!/usr/bin/env python3
"""Fail closed on lost voice control; recover only with backend cooperation."""

import os
from pathlib import Path
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

HEALTH_URL = os.environ["VOICE_HEALTH_URL"]
COMPOSE_FILE = os.environ.get("VOICE_COMPOSE_FILE", "/opt/avalon/deploy/voice/compose.yaml")
MARKER = Path(os.environ.get("VOICE_WATCHDOG_MARKER", "/var/lib/avalon-voice-watchdog/latched"))
GRACE_SECONDS = 10
POLL_SECONDS = 2
RECOVERY_SECONDS = 30
RETRY_SECONDS = 30
MAX_RETRY_SECONDS = 300


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_ok(url, method="GET"):
    try:
        request = Request(url, method=method, headers={"Cache-Control": "no-store"})
        with build_opener(ProxyHandler({}), NoRedirect()).open(request, timeout=2) as response:
            return response.status == 204
    except HTTPError as error:
        error.close()
        return False
    except (OSError, URLError):
        return False


def healthy():
    return request_ok(HEALTH_URL)


def prepare_recovery():
    # Same private origin; old backends return 404 and stay safely latched.
    url = urlparse(HEALTH_URL)._replace(path="/recovery/voice").geturl()
    return request_ok(url, "POST")


def compose(*args):
    try:
        return subprocess.run(
            ["docker", "compose", "-f", COMPOSE_FILE, *args],
            timeout=8, check=False, capture_output=True, text=True,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None


def livekit_running():
    result = compose("ps", "--status", "running", "-q", "livekit")
    return bool(result is not None and result.returncode == 0 and result.stdout.strip())


def stop_livekit():
    result = compose("stop", "-t", "2", "livekit")
    if result is not None and result.returncode == 0:
        # A successful stop must also be confirmed; errors are not proof of stop.
        state = compose("ps", "--status", "running", "-q", "livekit")
        if state is not None and state.returncode == 0 and not state.stdout.strip():
            return True
    print("voice watchdog: LiveKit stop not confirmed; retrying", flush=True)
    return False


def start_livekit():
    # Never create/pull a new container during recovery; configuration is deployed separately.
    result = compose("start", "livekit")
    return bool(result is not None and result.returncode == 0 and livekit_running())


class Watchdog:
    def __init__(self):
        self.unhealthy_since = None
        self.recovery_deadline = None
        self.retry_at = 0
        self.retry_delay = RETRY_SECONDS

    def retry_later(self, now):
        self.recovery_deadline = None
        self.retry_at = now + self.retry_delay
        self.retry_delay = min(self.retry_delay * 2, MAX_RETRY_SECONDS)

    def tick(self, now):
        if MARKER.exists():
            if self.recovery_deadline is not None:
                if healthy() and livekit_running():
                    MARKER.unlink()
                    self.unhealthy_since = None
                    self.recovery_deadline = None
                    self.retry_delay = RETRY_SECONDS
                    print("voice watchdog: recovery complete; voice control healthy", flush=True)
                elif now >= self.recovery_deadline:
                    stopped = stop_livekit()
                    self.retry_later(now)
                    outcome = "media stopped" if stopped else "stop unconfirmed; retrying"
                    print(f"voice watchdog: recovery timed out; {outcome}", flush=True)
                return
            stopped = stop_livekit()
            if now < self.retry_at:
                return
            if stopped and prepare_recovery() and start_livekit():
                self.recovery_deadline = now + RECOVERY_SECONDS
                print("voice watchdog: recovering; waiting for backend media cleanup", flush=True)
            else:
                # start may have partly succeeded before timing out.
                stop_livekit()
                self.retry_later(now)
            return
        if healthy() and livekit_running():
            self.unhealthy_since = None
            return
        if self.unhealthy_since is None:
            self.unhealthy_since = now
        if now - self.unhealthy_since >= GRACE_SECONDS:
            MARKER.write_text("Voice control unavailable; automatic recovery pending.\n")
            print("voice watchdog: control health failed; LiveKit latched off", flush=True)
            stop_livekit()


def main():
    parsed = urlparse(HEALTH_URL)
    if (parsed.scheme not in ("http", "https") or not parsed.netloc
            or parsed.path != "/health/voice" or parsed.query or parsed.fragment
            or parsed.username or parsed.password):
        raise SystemExit("VOICE_HEALTH_URL must point to the private /health/voice endpoint")
    MARKER.parent.mkdir(parents=True, exist_ok=True)
    control = Watchdog()
    while True:
        control.tick(time.monotonic())
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
