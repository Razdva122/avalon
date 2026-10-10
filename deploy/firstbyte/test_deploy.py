import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
from collections import namedtuple
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).with_name('deploy.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)

OLD = '''name: avalon-production
services:
  backend:
    image: razdva12/backend-avalon@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  ui:
    image: razdva12/nginx-avalon@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  mongodb:
    image: mongo@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
volumes:
  production-db:
'''
NEW = {
    'backend': 'razdva12/backend-avalon@sha256:' + '1' * 64,
    'ui': 'razdva12/nginx-avalon@sha256:' + '2' * 64,
}


class DeployTests(unittest.TestCase):
    def test_ssh_boundary_rejects_commands_and_shell_payloads(self):
        for value in ['deploy v71.0.0', 'check v72.0.0-rc.1']:
            self.assertEqual(deploy.parse_command(value), tuple(value.split(' ')))
        for value in ['', 'bash', '--run v71.0.0', 'deploy master', 'deploy v1.0.0;id',
                      'deploy v1.0.0\nid', 'deploy v1.0.0\n', 'deploy $(id)',
                      'deploy v1.0.0 ' , 'deploy v1.0.0-' + 'a' * 128]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                deploy.parse_command(value)

    def test_only_app_images_change_and_ambiguous_compose_is_rejected(self):
        result = deploy.replace_images(OLD, NEW)
        self.assertIn(NEW['backend'], result)
        self.assertIn(NEW['ui'], result)
        self.assertIn('image: mongo@sha256:' + 'c' * 64, result)
        self.assertTrue(result.endswith('volumes:\n  production-db:\n'))
        with self.assertRaises(ValueError):
            deploy.replace_images(OLD + OLD, NEW)

    def scenario(self, failure=None, check=False, same=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            compose = root / 'compose.production.yaml'
            compose.write_text(OLD)
            (root / 'check-idle.cjs').write_text('check rooms')
            if failure == 'pending':
                (root / 'deploy-pending.json').write_text('{}')
            steps, starts = [], []

            def command(args, **kwargs):
                steps.append(args)
                if args[:2] == ['docker', 'pull'] and failure == 'pull':
                    raise subprocess.CalledProcessError(1, args)
                if args[:3] == ['docker', 'image', 'inspect']:
                    service = 'backend' if 'backend-avalon' in args[-1] else 'ui'
                    digest = ('a' if service == 'backend' else 'b') * 64 if same else NEW[service].split(':')[-1]
                    repository = 'backend-avalon' if service == 'backend' else 'nginx-avalon'
                    return json.dumps([f'razdva12/{repository}@sha256:{digest}'])
                if args == ['systemctl', 'start', 'avalon-backup.service'] and failure == 'backup':
                    raise subprocess.CalledProcessError(1, args)
                if args[:2] == ['docker', 'exec'] and kwargs.get('input') == 'check rooms' and failure == 'busy':
                    raise subprocess.CalledProcessError(3, args)
                if 'up' in args:
                    starts.append(compose.read_text())
                    if failure == 'start' and len(starts) == 1:
                        raise subprocess.CalledProcessError(1, args)
                return ''

            def health():
                if failure == 'health' and len(starts) == 1:
                    raise RuntimeError('unhealthy')

            with patch.object(deploy, 'ROOT', root), patch.object(deploy, 'run', side_effect=command), \
                 patch.object(deploy, 'health', side_effect=health), \
                 patch.object(deploy.shutil, 'disk_usage', return_value=namedtuple('usage', 'total used free')(40, 10, (1 if failure == 'disk' else 30) * 1024**3)):
                if failure:
                    with self.assertRaises((RuntimeError, subprocess.CalledProcessError)):
                        deploy.deploy('v72.0.0', check_only=check)
                else:
                    deploy.deploy('v72.0.0', check_only=check)
            return compose.read_text(), starts, steps

    def test_success_backs_up_before_replacing_only_app_services(self):
        final, starts, steps = self.scenario()
        self.assertIn(NEW['backend'], final)
        self.assertEqual(len(starts), 1)
        backup = steps.index(['systemctl', 'start', 'avalon-backup.service'])
        up = next(i for i, step in enumerate(steps) if 'up' in step)
        self.assertLess(backup, up)
        self.assertEqual(steps[up][-2:], ['backend', 'ui'])
        self.assertIn('--no-deps', steps[up])

    def test_failures_before_activation_do_not_change_compose_or_restart(self):
        for failure in ['pull', 'backup', 'busy', 'pending', 'disk']:
            with self.subTest(failure=failure):
                final, starts, _ = self.scenario(failure)
                self.assertEqual(final, OLD)
                self.assertEqual(starts, [])

    def test_start_or_health_failure_restores_previous_images(self):
        for failure in ['start', 'health']:
            with self.subTest(failure=failure):
                final, starts, _ = self.scenario(failure)
                self.assertEqual(final, OLD)
                self.assertEqual(len(starts), 2)
                self.assertEqual(starts[-1], OLD)

    def test_check_and_same_digest_do_not_restart_or_make_backup(self):
        for options in [{'check': True}, {'same': True}]:
            final, starts, steps = self.scenario(**options)
            self.assertEqual(final, OLD)
            self.assertEqual(starts, [])
            self.assertNotIn(['systemctl', 'start', 'avalon-backup.service'], steps)


if __name__ == '__main__':
    unittest.main()
