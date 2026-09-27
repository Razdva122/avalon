import gzip
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('backup-mongodb.sh')


class BackupTest(unittest.TestCase):
    def run_backup(self, failure='', existing_lock=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            docker = root / 'docker'
            docker.write_text('''#!/usr/bin/env python3
import gzip, os, signal, sys
from pathlib import Path
args = ' '.join(sys.argv)
kind = 'unlock' if 'fsyncUnlock' in args else 'lock' if 'fsyncLock()' in args else 'preflight' if 'currentOp' in args else 'dump'
with open(os.environ['BACKUP_TEST_LOG'], 'a') as log: log.write(kind + '\\n')
state = Path(os.environ['BACKUP_TEST_STATE'])
failure = os.environ.get('BACKUP_TEST_FAIL')
if kind == 'preflight' and state.exists(): sys.exit(9)
if kind == 'lock':
    state.write_text('locked')
    if failure == 'acquisition': sys.exit(7)
    if failure == 'signal': os.kill(os.getppid(), signal.SIGTERM)
if kind == 'unlock': state.unlink(missing_ok=True)
if kind == 'dump':
    if failure == 'dump': sys.exit(7)
    sys.stdout.buffer.write(gzip.compress(b'test archive'))
''')
            docker.chmod(0o755)
            destination = root / 'backup.gz'
            log = root / 'log'
            state = root / 'locked'
            if existing_lock:
                state.write_text('previous lock')
            result = subprocess.run(['sh', str(SCRIPT), str(destination)], env={
                **os.environ, 'PATH': str(root) + os.pathsep + os.environ['PATH'],
                'BACKUP_TEST_LOG': str(log), 'BACKUP_TEST_FAIL': failure,
                'BACKUP_TEST_STATE': str(state), 'MONGODB_BACKUP_LOCK_DIR': str(root / 'mutex'),
            }, capture_output=True)
            events = log.read_text().splitlines() if log.exists() else []
            content = gzip.decompress(destination.read_bytes()) if destination.exists() else None
            return result.returncode, events, content, state.exists()

    def test_dump_runs_between_lock_and_unlock(self):
        code, events, content, locked = self.run_backup()
        self.assertEqual(code, 0)
        self.assertEqual(events, ['preflight', 'lock', 'dump', 'unlock'])
        self.assertEqual(content, b'test archive')
        self.assertFalse(locked)

    def test_dump_failure_unlocks_and_does_not_publish_backup(self):
        code, events, content, locked = self.run_backup('dump')
        self.assertNotEqual(code, 0)
        self.assertEqual(events, ['preflight', 'lock', 'dump', 'unlock'])
        self.assertIsNone(content)
        self.assertFalse(locked)

    def test_server_lock_is_released_when_acquisition_response_fails(self):
        code, events, content, locked = self.run_backup('acquisition')
        self.assertNotEqual(code, 0)
        self.assertEqual(events, ['preflight', 'lock', 'unlock'])
        self.assertIsNone(content)
        self.assertFalse(locked)

    def test_interrupted_acquisition_unlocks(self):
        code, events, content, locked = self.run_backup('signal')
        self.assertNotEqual(code, 0)
        self.assertEqual(events, ['preflight', 'lock', 'unlock'])
        self.assertIsNone(content)
        self.assertFalse(locked)

    def test_existing_database_lock_is_left_alone(self):
        code, events, content, locked = self.run_backup(existing_lock=True)
        self.assertNotEqual(code, 0)
        self.assertEqual(events, ['preflight'])
        self.assertIsNone(content)
        self.assertTrue(locked)


if __name__ == '__main__':
    unittest.main()
