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
        for value in ['deploy v71.0.0', 'check v72.0.0-rc.1', 'deploy-skip-rooms v71.0.0']:
            self.assertEqual(deploy.parse_command(value), tuple(value.split(' ')))
        for value in ['', 'bash', '--run v71.0.0', 'deploy master', 'deploy v1.0.0;id',
                      'deploy v1.0.0\nid', 'deploy v1.0.0\n', 'deploy $(id)',
                      'deploy v1.0.0 ', 'deploy-skip-rooms v1.0.0;id', 'deploy v1.0.0 --skip-room-check', 'deploy v1.0.0-' + 'a' * 128]:
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

    def scenario(self, failure=None, check=False, same=False, skip=False, cleanup_failure=False):
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
                if args == ['systemctl', 'start', 'avalon-backup.service']:
                    raise AssertionError('Deployment must not wait for off-host backup')
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

            def cleanup():
                with (root / 'deploy.lock').open('a') as other:
                    with self.assertRaises(BlockingIOError):
                        deploy.fcntl.flock(other, deploy.fcntl.LOCK_EX | deploy.fcntl.LOCK_NB)
                self.assertFalse((root / 'deploy-pending.json').exists())
                self.assertEqual(json.loads((root / 'last-deploy.json').read_text())['tag'], 'v72.0.0')
                steps.append(['prune-images'])
                if cleanup_failure:
                    raise RuntimeError('cleanup failed')

            with patch.object(deploy, 'ROOT', root), patch.object(deploy, 'run', side_effect=command), \
                 patch.object(deploy, 'prune_images', create=True, side_effect=cleanup), \
                 patch.object(deploy, 'health', side_effect=health), \
                 patch.object(deploy, 'prepare_static', create=True, side_effect=RuntimeError('incomplete UI') if failure == 'static-prepare' else None, return_value=('ui-container', '.avalon-releases/' + '2' * 64, '.')), \
                 patch.object(deploy, 'switch_static', create=True) as static_switch, \
                 patch.object(deploy.shutil, 'disk_usage', return_value=namedtuple('usage', 'total used free')(40, 10, (1 if failure == 'disk' else 30) * 1024**3)):
                if failure and not (failure == 'busy' and skip):
                    with self.assertRaises((RuntimeError, subprocess.CalledProcessError)):
                        deploy.deploy('v72.0.0', check_only=check, skip_room_check=skip)
                else:
                    deploy.deploy('v72.0.0', check_only=check, skip_room_check=skip)
            if starts:
                self.assertGreaterEqual(static_switch.call_count, 1, "Deployment must switch static files without recreating ui")
                self.assertEqual(static_switch.call_args_list[0].args, ('ui-container', '.avalon-releases/' + '2' * 64))
                if failure in ['start', 'health']:
                    self.assertEqual(static_switch.call_args_list[-1].args, ('ui-container', '.'))
            else:
                static_switch.assert_not_called()
            return compose.read_text(), starts, steps

    def test_success_checks_rooms_after_pulls_before_replacing_only_app_services(self):
        final, starts, steps = self.scenario()
        self.assertIn(NEW['backend'], final)
        self.assertEqual(len(starts), 1)
        idle = next(i for i, step in enumerate(steps) if step[:2] == ['docker', 'exec'])
        pulls = [i for i, step in enumerate(steps) if step[:2] == ['docker', 'pull']]
        up = next(i for i, step in enumerate(steps) if 'up' in step)
        self.assertLess(max(pulls), idle)
        self.assertLess(idle, up)
        self.assertEqual(steps[up][-1:], ['backend'])
        self.assertNotIn('ui', steps[up])
        self.assertIn('--no-deps', steps[up])
        self.assertEqual(sum(step[:2] == ['docker', 'exec'] for step in steps), 1)
        self.assertEqual(steps[-1], ['prune-images'])

    def test_failures_before_activation_do_not_change_compose_or_restart(self):
        for failure in ['pull', 'busy', 'pending', 'disk', 'static-prepare']:
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

    def test_skip_rooms_allows_abandoned_games_without_backup(self):
        final, starts, steps = self.scenario(failure='busy', skip=True)
        self.assertIn(NEW['backend'], final)
        self.assertEqual(len(starts), 1)
        self.assertNotIn(['systemctl', 'start', 'avalon-backup.service'], steps)
        self.assertFalse(any(step[:2] == ['docker', 'exec'] for step in steps))

    def test_skip_rooms_does_not_bypass_health_rollback(self):
        final, starts, _ = self.scenario(failure='health', skip=True)
        self.assertEqual(final, OLD)
        self.assertEqual(len(starts), 2)

    def test_stopped_service_cannot_use_missing_stale_or_other_invocation_receipt(self):
        for receipt in [None, {'tag': 'v71.0.0', 'completedAt': 99},
                        {'tag': 'v71.0.0', 'completedAt': 101}]:
            with self.subTest(receipt=receipt), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                if receipt is not None:
                    (root / 'deploy-result-00000000000000000000000000000002.json').write_text(json.dumps(receipt))
                with patch.object(deploy, 'ROOT', root), \
                     patch.object(deploy.sys, 'argv', ['deploy.py', 'deploy v71.0.0']), \
                     patch.object(deploy.time, 'time', return_value=100), \
                     patch.object(deploy.uuid, 'uuid4', return_value=deploy.uuid.UUID(int=1)), \
                     patch.object(deploy.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)):
                    with self.assertRaises(RuntimeError):
                        deploy.main()

    def test_skip_flag_survives_systemd_dispatch_and_requires_success_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def process(args):
                if args[0] == 'systemd-run':
                    child_args = args[args.index('/usr/local/sbin/avalon-deploy'):]
                    with patch.object(deploy.sys, 'argv', child_args), \
                         patch.dict(deploy.os.environ, {}, clear=True), patch.object(deploy, 'deploy') as operation:
                        deploy.main()
                    operation.assert_called_once_with('v71.0.0', check_only=False, skip_room_check=True)
                    receipt = json.loads((root / ('deploy-result-' + child_args[3] + '.json')).read_text())
                    self.assertEqual(receipt['tag'], 'v71.0.0')
                    self.assertGreater(receipt['completedAt'], 0)
                    (root / 'deploy-result-foreign.json').write_text('{}')
                return subprocess.CompletedProcess(args, 0)
            with patch.object(deploy, 'ROOT', root), \
                 patch.object(deploy.sys, 'argv', ['deploy.py', 'deploy-skip-rooms v71.0.0']), \
                 patch.object(deploy.subprocess, 'run', side_effect=process):
                deploy.main()
            self.assertEqual(list(root.glob('deploy-result-*.json')), [root / 'deploy-result-foreign.json'])

    def test_check_and_same_digest_do_not_restart_or_make_backup(self):
        for options in [{'check': True}, {'same': True}]:
            final, starts, steps = self.scenario(**options)
            self.assertEqual(final, OLD)
            self.assertEqual(starts, [])
            self.assertNotIn(['systemctl', 'start', 'avalon-backup.service'], steps)
            self.assertNotIn(['prune-images'], steps)

    def test_cleanup_never_runs_after_failed_deployment(self):
        for failure in ['pull', 'busy', 'pending', 'disk', 'static-prepare', 'start', 'health']:
            with self.subTest(failure=failure):
                _, _, steps = self.scenario(failure)
                self.assertNotIn(['prune-images'], steps)

    def test_retention_keeps_three_numeric_releases_and_protected_or_unknown_images(self):
        images = []
        for tag in ['v9.0.0', 'v10.0.0', 'v11.0.0', 'v12.0.0', 'v13.0.0']:
            for service, repo in deploy.REPOS.items():
                images.append({'Id': service + tag, 'RepoTags': [repo + ':' + tag]})
        images += [
            {'Id': 'incomplete', 'RepoTags': ['razdva12/backend-avalon:v14.0.0']},
            {'Id': 'prerelease', 'RepoTags': ['razdva12/backend-avalon:v15.0.0-rc.1']},
            {'Id': 'untagged', 'RepoTags': []},
            {'Id': 'smtp', 'RepoTags': ['avalon-backend:smtp-old']},
            {'Id': 'foreign', 'RepoTags': ['mongo:6']},
            {'Id': 'alias', 'RepoTags': ['razdva12/backend-avalon:v1.0.0', 'private:keep']},
            {'Id': 'shared', 'RepoTags': ['razdva12/backend-avalon:v9.0.0', 'razdva12/backend-avalon:v13.0.0']},
        ]
        candidates = deploy.image_prune_candidates(images, {'backendv9.0.0', 'uiv10.0.0'})
        self.assertEqual({image['Id'] for image in candidates}, {'uiv9.0.0', 'backendv10.0.0'})

    def test_cleanup_failure_does_not_rollback_healthy_release(self):
        final, starts, steps = self.scenario(cleanup_failure=True)
        self.assertIn(NEW['backend'], final)
        self.assertEqual(len(starts), 1)
        self.assertEqual(steps[-1], ['prune-images'])

    def test_cleanup_resolves_digest_protection_and_aborts_before_deletion_on_inspect_failure(self):
        images = [{'Id': service + str(version), 'RepoTags': [repo + f':v{version}.0.0']}
                  for version in range(1, 6) for service, repo in deploy.REPOS.items()]
        images[2]['RepoTags'].append('razdva12/backend-avalon:v0.0.0')
        images.append({'Id': 'extra-ui', 'RepoTags': ['razdva12/nginx-avalon:v0.0.0']})
        for broken in [False, 'inspect', 'compose', 'containers', 'receipt', 'pending']:
            with self.subTest(broken=broken), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                (root / 'compose.production.yaml').write_text(OLD)
                (root / 'compose.previous.yaml').write_text(OLD)
                (root / 'last-deploy.json').write_text(json.dumps({'images': NEW}))
                if broken == 'receipt':
                    (root / 'last-deploy.json').write_text('{')
                if broken == 'pending':
                    (root / 'deploy-pending.json').write_text('{}')
                removed = []

                def command(args, **kwargs):
                    if args[:2] == ['docker', 'compose']:
                        if broken == 'compose':
                            raise subprocess.CalledProcessError(1, args)
                        return 'current-ref' if args[3].endswith('compose.production.yaml') else 'rollback-ref'
                    if args == ['docker', 'ps', '-aq']:
                        if broken == 'containers':
                            raise subprocess.CalledProcessError(1, args)
                        return 'running-gateway'
                    if args == ['docker', 'inspect', 'running-gateway']:
                        return json.dumps([{'Image': 'ui1'}])
                    if args == ['docker', 'image', 'ls', '-aq', '--no-trunc']:
                        return '\n'.join(image['Id'] for image in images)
                    if args[:3] == ['docker', 'image', 'inspect']:
                        if set(args[3:]) == {image['Id'] for image in images}:
                            return json.dumps(images)
                        if broken == 'inspect':
                            raise subprocess.CalledProcessError(1, args)
                        return json.dumps([{'Id': 'backend1'}, {'Id': 'ui2'}])
                    if args[:3] == ['docker', 'image', 'rm']:
                        self.assertNotIn('--force', args)
                        removed.extend(args[3:])
                        return ''
                    raise AssertionError(args)

                with patch.object(deploy, 'ROOT', root), patch.object(deploy, 'run', side_effect=command):
                    if broken:
                        with self.assertRaises((subprocess.CalledProcessError, ValueError, RuntimeError)):
                            deploy.prune_images()
                        self.assertEqual(removed, [])
                    else:
                        deploy.prune_images()
                        self.assertEqual(removed, ['razdva12/backend-avalon:v2.0.0',
                                                   'razdva12/backend-avalon:v0.0.0',
                                                   'razdva12/nginx-avalon:v0.0.0'])


if __name__ == '__main__':
    unittest.main()
