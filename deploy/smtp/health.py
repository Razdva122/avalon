#!/usr/bin/env python3
"""Record local SMTP health without sending messages or logging credentials."""
import datetime as dt
import json
from pathlib import Path
import ssl
import subprocess
import time

from check import client

ROOT = Path('/opt/avalon/smtp')
COMPOSE = ['docker', 'compose', '-f', str(ROOT / 'compose.yaml')]


def main():
    status = {'checkedUTC': dt.datetime.now(dt.timezone.utc).isoformat()}
    try:
        status['check'] = 'mail_processes'
        subprocess.run(COMPOSE + ['exec', '-T', 'smtp', 'dms-healthcheck'],
                       check=True, timeout=15, capture_output=True)
        status['check'] = 'inbound_discard_configuration'
        result = subprocess.run(COMPOSE + ['exec', '-T', 'smtp', 'postconf', '-h', 'virtual_transport', 'local_transport'],
                                check=True, timeout=15, capture_output=True, text=True)
        assert result.stdout.splitlines() == ['discard:inbound-not-monitored'] * 2, 'Inbound discard disabled'
        status['check'] = 'public_inbound_smtp'
        subprocess.run(['python3', str(ROOT / 'check-inbound.py')],
                       check=True, timeout=60, capture_output=True)
        status['check'] = 'tls_connection'
        with client() as connection:
            status['check'] = 'certificate_expiry'
            expires = ssl.cert_time_to_seconds(connection.sock.getpeercert()['notAfter'])
            assert expires - time.time() > 7 * 86400, 'Certificate renewal required'
        status['check'] = 'mail_queue'
        result = subprocess.run(COMPOSE + ['exec', '-T', 'smtp', 'postqueue', '-j'],
                                check=True, timeout=15, capture_output=True, text=True)
        queue = [json.loads(line) for line in result.stdout.splitlines() if line.strip()]
        status['queuedMessages'] = len(queue)
        status['oldestQueueAgeSeconds'] = max(
            (max(0, int(time.time() - entry['arrival_time'])) for entry in queue), default=0)
        assert len(queue) < 100 and status['oldestQueueAgeSeconds'] < 3600, 'Mail queue needs review'
        status['healthy'] = True
        status.pop('check')
    except Exception as error:
        status.update(healthy=False, errorType=type(error).__name__)
    temporary = ROOT / 'health.json.tmp'
    temporary.write_text(json.dumps(status, indent=2) + '\n')
    temporary.replace(ROOT / 'health.json')
    print(json.dumps(status))
    return 0 if status['healthy'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
