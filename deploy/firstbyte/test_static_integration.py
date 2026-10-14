"""Opt-in real Docker/HTTP rollout test; never touches production containers.

AVALON_DOCKER_TEST_IMAGE=razdva12/nginx-avalon@sha256:... python3 -m unittest ...
The image must already be pulled. Ports are published only on loopback.
"""
import importlib.util
import os
from pathlib import Path
import shutil
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).with_name('deploy.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
IMAGE = os.environ.get('AVALON_DOCKER_TEST_IMAGE')


@unittest.skipUnless(IMAGE and shutil.which('docker'), 'Set AVALON_DOCKER_TEST_IMAGE on a Docker host')
class StaticIntegrationTests(unittest.TestCase):
    def test_http_stays_available_during_prepare_switch_and_rollback_and_survives_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copy(Path(__file__).parents[1] / 'nginx' / 'entrypoint.sh', root / 'nginx-entrypoint.sh')
            (root / 'nginx-entrypoint.sh').chmod(0o755)
            config = root / 'nginx.conf'
            config.write_text('''events { worker_connections 128; }
http {
  include /etc/nginx/mime.types;
  server {
    listen 80;
    root /app;
    index index.html;
    location / { try_files $uri $uri/ =404; }
    location /api/support {
      proxy_pass http://127.0.0.1:9;
    }
  }
}
''')
            ui = deploy.run(['docker', 'create', '--publish', '127.0.0.1::80',
                             '--mount', f'type=bind,source={config},target=/etc/nginx/nginx.conf,readonly', IMAGE])
            try:
                deploy.run(['docker', 'cp', str(root / 'nginx-entrypoint.sh'), ui + ':/usr/local/bin/avalon-nginx-entrypoint'])
                deploy.run(['docker', 'start', ui])
                port = deploy.run(['docker', 'port', ui, '80/tcp']).split(':')[-1]
                url = 'http://127.0.0.1:' + port
                deploy.run(['docker', 'exec', ui, 'sh', '-eu', '-c',
                            'printf OLD > /app/index.html; mkdir -p /app/js; printf OLD_ASSET > /app/js/old.12345678.js'])

                def get(path='/'):
                    with urllib.request.urlopen(url + path, timeout=3) as response:
                        return response.read()

                deadline = time.monotonic() + 10
                while True:
                    try:
                        self.assertEqual(get(), b'OLD')
                        break
                    except OSError:
                        if time.monotonic() > deadline:
                            raise
                        time.sleep(.1)
                with self.assertRaises(urllib.error.HTTPError) as error:
                    get('/api/support')
                self.assertEqual(error.exception.code, 502)
                stop = threading.Event()
                samples, failures = [], []

                def monitor():
                    while not stop.is_set():
                        try:
                            samples.append(get())
                        except Exception as error:
                            failures.append(str(error))
                        stop.wait(.01)

                thread = threading.Thread(target=monitor)
                thread.start()
                try:
                    with patch.object(deploy, 'ROOT', root), patch.object(deploy, 'compose', return_value=ui):
                        actual_ui, release, previous = deploy.prepare_static(IMAGE)
                        self.assertEqual(actual_ui, ui)
                        self.assertEqual(previous, '.')
                        self.assertEqual(get(), b'OLD')
                        deploy.switch_static(ui, release)
                        deploy.run(['docker', 'exec', ui, 'sh', '-eu', '-c',
                                    'printf NEW_ASSET > /app/.avalon-current/js/new.87654321.js'])
                        new = get()
                        self.assertNotEqual(new, b'OLD')
                        self.assertEqual(get('/js/old.12345678.js'), b'OLD_ASSET')
                        # Backend-only releases reuse static files without copying over the active release.
                        self.assertEqual(deploy.prepare_static(IMAGE), (ui, release, release))
                        for _ in range(10):
                            deploy.switch_static(ui, previous)
                            self.assertEqual(get(), b'OLD')
                            self.assertEqual(get('/js/new.87654321.js'), b'NEW_ASSET')
                            deploy.switch_static(ui, release)
                            self.assertEqual(get(), new)
                finally:
                    stop.set()
                    thread.join()
                self.assertEqual(failures, [])
                self.assertGreater(len(samples), 10)
                self.assertTrue(all(body in (b'OLD', new) for body in samples))
                deploy.run(['docker', 'restart', ui])
                port = deploy.run(['docker', 'port', ui, '80/tcp']).split(':')[-1]
                url = 'http://127.0.0.1:' + port
                deadline = time.monotonic() + 10
                while True:
                    try:
                        self.assertEqual(get(), new)
                        break
                    except OSError:
                        if time.monotonic() > deadline:
                            raise
                        time.sleep(.1)
                self.assertEqual(get('/js/old.12345678.js'), b'OLD_ASSET')
                print(f'HTTP rollout: {len(samples)} requests, zero failures; API 502; restart retained UI')
            finally:
                deploy.run(['docker', 'rm', '-f', ui])


if __name__ == '__main__':
    unittest.main()
