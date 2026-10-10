#!/usr/bin/python3
"""Restricted manual deployment entry point, installed root-owned on FirstByte."""

import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

ROOT = Path('/opt/avalon/production')
REPOS = {'backend': 'razdva12/backend-avalon', 'ui': 'razdva12/nginx-avalon'}
TAG = r'v[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9][A-Za-z0-9.-]*)?'
SMOKE = """
const {io} = require('socket.io-client');
const socket = io('https://avalon-game.com', {transports:['websocket'], reconnection:false});
const timer = setTimeout(() => process.exit(1), 15000);
socket.on('connect', () => socket.emit('getRolesWithRatings', roles => {
  clearTimeout(timer); socket.close(); process.exit(Array.isArray(roles) && roles.length > 0 ? 0 : 1);
}));
"""


def parse_command(value):
    match = re.fullmatch(r'(deploy|deploy-skip-rooms|check) (' + TAG + ')', value)
    if not match or len(match[2]) > 128:
        raise ValueError('Expected deploy, deploy-skip-rooms or check followed by vX.Y.Z')
    return match[1], match[2]


def run(args, *, timeout=180, input=None):
    result = subprocess.run(args, input=input, text=True, capture_output=True, timeout=timeout)
    if result.returncode:
        # Do not dump container logs or environment files into GitHub Actions.
        raise subprocess.CalledProcessError(result.returncode, args)
    return result.stdout.strip()


def compose(*args):
    return run(['docker', 'compose', '-f', str(ROOT / 'compose.production.yaml'), *args], timeout=240)


def replace_images(content, images):
    for service, repository in REPOS.items():
        image = images[service]
        if not re.fullmatch(re.escape(repository) + r'@sha256:[0-9a-f]{64}', image):
            raise ValueError('Unexpected image digest')
        # Fail if the production compose layout changed; never rewrite other services.
        pattern = r'(?m)^(  ' + service + r':\n(?:    [^\n]*\n)*?    image: )[^\n]+$'
        content, count = re.subn(pattern, lambda m: m[1] + image, content)
        if count != 1:
            raise ValueError('Expected exactly one image for ' + service)
    return content


def write_compose(content):
    target = ROOT / 'compose.production.yaml'
    temporary = ROOT / 'compose.deploy.tmp'
    temporary.write_text(content)
    temporary.chmod(target.stat().st_mode & 0o777)
    temporary.replace(target)


def idle():
    run(['docker', 'exec', '-i', '-w', '/app', 'avalon-production-backend-1', 'node', '-'],
        input=(ROOT / 'check-idle.cjs').read_text(), timeout=25)


def health():
    # Watchdog may stop/recover LiveKit while backend restarts. Give it time.
    deadline = time.monotonic() + 120
    while True:
        try:
            status = run(['curl', '--silent', '--show-error', '--max-time', '5',
                          '--output', '/dev/null', '--write-out', '%{http_code}',
                          'http://127.0.0.1:7882/health/voice'])
            run(['systemctl', 'is-active', '--quiet', 'avalon-production-watchdog.service'])
            livekit = compose('ps', '--status', 'running', '-q', 'livekit')
            if status == '204' and livekit and not Path('/var/lib/avalon-production-watchdog/latched').exists():
                break
        except (subprocess.SubprocessError, OSError):
            pass
        if time.monotonic() >= deadline:
            raise RuntimeError('Voice control did not become healthy')
        time.sleep(3)
    run(['curl', '--fail', '--silent', '--show-error', '--max-time', '15',
         '--resolve', 'avalon-game.com:443:127.0.0.1', '--output', '/dev/null', 'https://avalon-game.com/'])
    compose('exec', '-T', 'ui', 'nginx', '-t')
    run(['docker', 'exec', '-i', '-w', '/app', 'avalon-production-backend-1', 'node', '-'], input=SMOKE, timeout=25)


def activate():
    compose('up', '-d', '--no-deps', '--pull', 'never', '--wait', '--wait-timeout', '150', 'backend', 'ui')
    health()


def deploy(tag, check_only=False, skip_room_check=False):
    parse_command('deploy ' + tag)
    target = ROOT / 'compose.production.yaml'
    pending = ROOT / 'deploy-pending.json'
    with (ROOT / 'deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if pending.exists():
            raise RuntimeError('Previous deployment was interrupted: operator must inspect deploy-pending.json')
        if shutil.disk_usage(ROOT).free < 5 * 1024**3:
            raise RuntimeError('At least 5 GiB free space is required')
        compose('config', '--quiet')
        previous = target.read_text()
        images = {}
        print('Pulling both release images before changing production', flush=True)
        for service, repository in REPOS.items():
            run(['docker', 'pull', '--platform', 'linux/amd64', repository + ':' + tag], timeout=600)
            digests = json.loads(run(['docker', 'image', 'inspect', '--format', '{{json .RepoDigests}}', repository + ':' + tag]))
            images[service] = next(d for d in digests if d.startswith(repository + '@sha256:'))
        candidate = replace_images(previous, images)
        if check_only or candidate == previous:
            health()
            print('Preflight OK; ' + ('no changes requested' if check_only else 'release already installed'), flush=True)
            return
        if skip_room_check:
            print('WARNING: room checks explicitly skipped; unfinished games may lose their state', flush=True)
        else:
            idle()
        print('Creating a verified off-host backup', flush=True)
        run(['systemctl', 'start', 'avalon-backup.service'], timeout=2800)
        if not skip_room_check:
            idle()
        # The backup script verifies off-host readback before reporting success.
        (ROOT / 'compose.previous.yaml').write_text(previous)
        pending.write_text(json.dumps({'tag': tag, 'images': images, 'skipRoomCheck': skip_room_check, 'startedAt': time.time()}))
        try:
            write_compose(candidate)
            compose('config', '--quiet')
            print('Activating backend and UI', flush=True)
            activate()
            (ROOT / 'last-deploy.json').write_text(json.dumps({'tag': tag, 'images': images, 'skipRoomCheck': skip_room_check, 'completedAt': time.time()}))
        except Exception:
            print('Deployment failed; restoring previous application images', flush=True)
            write_compose(previous)
            activate()
            pending.unlink()
            print('Previous application restored; database was not rolled back', flush=True)
            raise
        pending.unlink()
        print('Deployment healthy: ' + tag, flush=True)


def main():
    os.umask(0o077)
    # Internal mode is invoked only by the root-owned systemd service command.
    if len(sys.argv) == 3 and sys.argv[1] == '--run' and not os.environ.get('SUDO_USER'):
        mode, tag = parse_command(sys.argv[2])
        return deploy(tag, check_only=mode == 'check', skip_room_check=mode == 'deploy-skip-rooms')
    if len(sys.argv) != 2:
        raise ValueError('One SSH command argument required')
    mode, tag = parse_command(sys.argv[1])
    if mode == 'check':
        return deploy(tag, check_only=True)
    # A disconnected/cancelled runner must not kill rollback. Each external operation
    # has its own timeout; do not impose a service deadline that could kill rollback.
    started = str(int(time.time()))
    result = subprocess.run([
        'systemd-run', '--unit=avalon-deploy', '--collect', '--wait', '--quiet',
        '--property=UMask=0077',
        '/usr/local/sbin/avalon-deploy', '--run', f'{mode} {tag}',
    ])
    subprocess.run(['journalctl', '-u', 'avalon-deploy', '--since=@' + started, '--no-pager', '-o', 'cat'])
    if result.returncode:
        raise RuntimeError('Deployment failed; inspect avalon-deploy journal')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
