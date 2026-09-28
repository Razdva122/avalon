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
    posts = []

    def do_GET(self):
        self.send_response(self.status)
        if self.status == 302:
            self.send_header('Location', '/health/voice')
        self.end_headers()

    def do_POST(self):
        self.posts.append(self.path)
        self.do_GET()

    def log_message(self, *_args):
        pass


class WatchdogTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.marker = Path(self.directory.name) / 'latched'
        self.marker_patch = patch.object(watchdog, 'MARKER', self.marker)
        self.marker_patch.start()
        self.addCleanup(self.marker_patch.stop)

    def test_restart_recovers_only_after_stop_prepare_start_and_health(self):
        events = []
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'healthy', return_value=False), \
             patch.object(watchdog, 'livekit_running', return_value=True):
            control.tick(0)
            with patch.object(watchdog, 'stop_livekit', side_effect=lambda: events.append('stop') or True):
                control.tick(11)
        self.assertTrue(self.marker.exists())
        with patch.object(watchdog, 'stop_livekit', side_effect=lambda: events.append('stop') or True), \
             patch.object(watchdog, 'prepare_recovery', side_effect=lambda: events.append('prepare') or True), \
             patch.object(watchdog, 'start_livekit', side_effect=lambda: events.append('start') or True), \
             patch.object(watchdog, 'healthy', return_value=False):
            control.tick(12)
            control.tick(14)
        self.assertEqual(events, ['stop', 'stop', 'prepare', 'start'])
        self.assertTrue(self.marker.exists())
        with patch.object(watchdog, 'healthy', return_value=True), \
             patch.object(watchdog, 'livekit_running', return_value=True):
            control.tick(16)
        self.assertFalse(self.marker.exists())

    def test_backend_unreachable_or_old_backend_never_starts_livekit(self):
        self.marker.touch()
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'stop_livekit', return_value=True), \
             patch.object(watchdog, 'prepare_recovery', return_value=False), \
             patch.object(watchdog, 'start_livekit') as start:
            control.tick(0)
            control.tick(2)
        start.assert_not_called()
        self.assertTrue(self.marker.exists())

    def test_failed_stop_never_prepares_or_starts(self):
        self.marker.touch()
        with patch.object(watchdog, 'stop_livekit', return_value=False), \
             patch.object(watchdog, 'prepare_recovery') as prepare, \
             patch.object(watchdog, 'start_livekit') as start:
            watchdog.Watchdog().tick(0)
        prepare.assert_not_called()
        start.assert_not_called()
        self.assertTrue(self.marker.exists())

    def test_recovery_timeout_stops_media_and_backs_off(self):
        self.marker.touch()
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'stop_livekit', return_value=True) as stop, \
             patch.object(watchdog, 'prepare_recovery', return_value=True), \
             patch.object(watchdog, 'start_livekit', return_value=True) as start, \
             patch.object(watchdog, 'healthy', return_value=False):
            control.tick(0)
            control.tick(31)
            control.tick(32)
            self.assertGreaterEqual(stop.call_count, 2)
            self.assertEqual(start.call_count, 1)
            control.tick(62)
            self.assertEqual(start.call_count, 2)
        self.assertTrue(self.marker.exists())

    def test_dead_livekit_is_recovered_even_when_backend_health_is_stale(self):
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'healthy', return_value=True), \
             patch.object(watchdog, 'livekit_running', return_value=False), \
             patch.object(watchdog, 'stop_livekit', return_value=True):
            control.tick(0)
            control.tick(11)
        self.assertTrue(self.marker.exists())

    def test_watchdog_restart_during_recovery_stops_media_before_another_handshake(self):
        self.marker.touch()
        events = []
        with patch.object(watchdog, 'stop_livekit', side_effect=lambda: events.append('stop') or True), \
             patch.object(watchdog, 'prepare_recovery', side_effect=lambda: events.append('prepare') or True), \
             patch.object(watchdog, 'start_livekit', side_effect=lambda: events.append('start') or True):
            watchdog.Watchdog().tick(0)
            watchdog.Watchdog().tick(2)
        self.assertEqual(events, ['stop', 'prepare', 'start', 'stop', 'prepare', 'start'])
        self.assertTrue(self.marker.exists())

    def test_partial_start_failure_is_stopped_again(self):
        self.marker.touch()
        with patch.object(watchdog, 'stop_livekit', return_value=True) as stop, \
             patch.object(watchdog, 'prepare_recovery', return_value=True), \
             patch.object(watchdog, 'start_livekit', return_value=False):
            watchdog.Watchdog().tick(0)
        self.assertEqual(stop.call_count, 2)
        self.assertTrue(self.marker.exists())

    def test_failed_stop_after_partial_start_keeps_retrying_even_during_backoff(self):
        self.marker.touch()
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'stop_livekit', side_effect=[True, False, False, False, False]) as stop, \
             patch.object(watchdog, 'prepare_recovery', return_value=True) as prepare, \
             patch.object(watchdog, 'start_livekit', return_value=False) as start:
            control.tick(0)
            control.tick(2)
            control.tick(30)
            self.assertEqual(stop.call_count, 5)
            self.assertEqual(prepare.call_count, 1)
            self.assertEqual(start.call_count, 1)
        self.assertTrue(self.marker.exists())

    def test_repeated_failures_back_off_with_a_five_minute_cap(self):
        self.marker.touch()
        control = watchdog.Watchdog()
        with patch.object(watchdog, 'stop_livekit', return_value=True), \
             patch.object(watchdog, 'prepare_recovery', return_value=False) as prepare:
            for count, now in enumerate([0, 30, 90, 210, 450, 750, 1050], 1):
                control.tick(now)
                control.tick(now + 2)
                self.assertEqual(prepare.call_count, count)

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
            HealthHandler.posts = []
            for status in [200, 302, 404, 503]:
                HealthHandler.status = status
                self.assertFalse(watchdog.prepare_recovery())
            HealthHandler.status = 204
            self.assertTrue(watchdog.prepare_recovery())
            self.assertEqual(HealthHandler.posts, ['/recovery/voice'] * 5)
        finally:
            watchdog.HEALTH_URL = original
            server.shutdown()
            server.server_close()
            thread.join()

    def test_stop_requires_successful_confirmation(self):
        from subprocess import CompletedProcess
        with patch.object(watchdog.subprocess, "run", side_effect=[
            CompletedProcess([], 0, "", ""), CompletedProcess([], 0, "", "")
        ]) as run:
            self.assertTrue(watchdog.stop_livekit())
        self.assertEqual(run.call_args_list[0].args[0],
                         ["docker", "compose", "-f", watchdog.COMPOSE_FILE, "stop", "-t", "2", "livekit"])
        with patch.object(watchdog.subprocess, "run", side_effect=[
            CompletedProcess([], 0, "", ""), CompletedProcess([], 1, "", "")
        ]):
            self.assertFalse(watchdog.stop_livekit())


if __name__ == "__main__":
    unittest.main()
