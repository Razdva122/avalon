#!/usr/bin/env python3
"""Latch LiveKit off when the backend can no longer prove voice control health."""

import os
from pathlib import Path
import subprocess
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import ProxyHandler, Request, build_opener


HEALTH_URL = os.environ["VOICE_HEALTH_URL"]
COMPOSE_FILE = os.environ.get("VOICE_COMPOSE_FILE", "/opt/avalon/deploy/voice/compose.yaml")
MARKER = Path(os.environ.get("VOICE_WATCHDOG_MARKER", "/var/lib/avalon-voice-watchdog/latched"))
GRACE_SECONDS = 10
POLL_SECONDS = 2


def healthy():
    try:
        request = Request(HEALTH_URL, headers={"Cache-Control": "no-store"})
        with build_opener(ProxyHandler({})).open(request, timeout=2) as response:
            return response.status == 204
    except HTTPError as error:
        error.close()
        return False
    except (OSError, URLError):
        return False


def stop_livekit():
    try:
        result = subprocess.run(
            ["docker", "compose", "-f", COMPOSE_FILE, "stop", "-t", "2", "livekit"],
            timeout=8,
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"voice watchdog: LiveKit stop failed (exit {result.returncode}); retrying", flush=True)
    except (OSError, subprocess.TimeoutExpired):
        print("voice watchdog: LiveKit stop failed; retrying", flush=True)


def main():
    parsed = urlparse(HEALTH_URL)
    if parsed.scheme not in ("http", "https") or parsed.path != "/health/voice" or parsed.query or parsed.fragment:
        raise SystemExit("VOICE_HEALTH_URL must point to the private /health/voice endpoint")
    MARKER.parent.mkdir(parents=True, exist_ok=True)
    unhealthy_since = None
    while True:
        if MARKER.exists():
            stop_livekit()
            time.sleep(POLL_SECONDS)
            continue
        if healthy():
            unhealthy_since = None
        else:
            now = time.monotonic()
            if unhealthy_since is None:
                unhealthy_since = now
            if now - unhealthy_since >= GRACE_SECONDS:
                MARKER.write_text("Backend voice control was unavailable; operator reset required.\n")
                print("voice watchdog: control health failed; LiveKit latched off", flush=True)
                stop_livekit()
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
