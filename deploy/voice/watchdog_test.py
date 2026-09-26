import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread


os.environ.setdefault("VOICE_HEALTH_URL", "http://127.0.0.1:1/health/voice")
spec = importlib.util.spec_from_file_location("voice_watchdog", Path(__file__).with_name("watchdog.py"))
watchdog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watchdog)


class HealthHandler(BaseHTTPRequestHandler):
    status = 204

    def do_GET(self):
        self.send_response(self.status)
        self.end_headers()

    def log_message(self, *_args):
        pass


class WatchdogTests(unittest.TestCase):
    def test_only_204_is_healthy(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), HealthHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        original = watchdog.HEALTH_URL
        watchdog.HEALTH_URL = f"http://127.0.0.1:{server.server_port}/health/voice"
        try:
            HealthHandler.status = 204
            self.assertTrue(watchdog.healthy())
            HealthHandler.status = 503
            self.assertFalse(watchdog.healthy())
        finally:
            watchdog.HEALTH_URL = original
            server.shutdown()
            server.server_close()
            thread.join()

    def test_unhealthy_period_latches_and_stops(self):
        class Done(Exception):
            pass

        with tempfile.TemporaryDirectory() as directory:
            original = watchdog.MARKER
            watchdog.MARKER = Path(directory) / "latched"
            try:
                with patch.object(watchdog, "healthy", return_value=False), \
                     patch.object(watchdog, "stop_livekit") as stop, \
                     patch.object(watchdog.time, "monotonic", side_effect=[0, 11]), \
                     patch.object(watchdog.time, "sleep", side_effect=[None, Done]):
                    with self.assertRaises(Done):
                        watchdog.main()
                self.assertTrue(watchdog.MARKER.exists())
                stop.assert_called_once()

                with patch.object(watchdog, "healthy", return_value=True) as health, \
                     patch.object(watchdog, "stop_livekit") as stop, \
                     patch.object(watchdog.time, "sleep", side_effect=Done):
                    with self.assertRaises(Done):
                        watchdog.main()
                health.assert_not_called()
                stop.assert_called_once()
            finally:
                watchdog.MARKER = original

    def test_stop_uses_compose_without_shell(self):
        with patch.object(watchdog.subprocess, "run") as run:
            run.return_value.returncode = 0
            watchdog.stop_livekit()
        args, kwargs = run.call_args
        self.assertEqual(args[0], ["docker", "compose", "-f", watchdog.COMPOSE_FILE, "stop", "-t", "2", "livekit"])
        self.assertFalse(kwargs["check"])
        self.assertNotIn("shell", kwargs)


if __name__ == "__main__":
    unittest.main()
