#!/usr/bin/env python3
"""Check public SMTP without mail; --discard-test sends only to our own address."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
import subprocess
import time

HOST = os.environ['SMTP_HOSTNAME']
ADDRESS = 'security@avalon-game.com'
ROOT = Path('/opt/avalon/smtp')
CONTAINER = 'avalon-smtp-smtp-1'


def docker(*args):
    return subprocess.run(['docker', *args], check=True, capture_output=True,
                          text=True, timeout=20).stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--discard-test', action='store_true')
    args = parser.parse_args()
    if args.discard_test:
        # Fail before DATA if a reconstruction could store the message instead.
        transports = docker('exec', CONTAINER, 'postconf', '-h', 'virtual_transport', 'local_transport').splitlines()
        assert transports == ['discard:inbound-not-monitored'] * 2
        before = {str(p) for p in (ROOT / 'data').rglob('*') if p.is_file() and p.parent.name in {'cur', 'new'}}
        started = dt.datetime.now(dt.timezone.utc).isoformat()

    # The VPS /etc/hosts maps HOST to loopback for existing local services.
    # Probe the published IPv4 port, while verifying TLS against its DNS name.
    with smtplib.SMTP(os.environ['SMTP_PUBLIC_IP'], 25, local_hostname=HOST, timeout=30) as connection:
        assert connection.ehlo()[0] == 250
        assert not connection.has_extn('auth'), 'Public SMTP must not offer authentication'
        assert connection.has_extn('starttls'), 'STARTTLS is missing'
        context = ssl.create_default_context()
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        connection._host = HOST  # smtplib uses this name for SNI and certificate validation.
        assert connection.starttls(context=context)[0] == 220
        assert connection.ehlo()[0] == 250
        assert not connection.has_extn('auth'), 'Public TLS SMTP must not offer authentication'
        for recipient in (os.environ['SMTP_TEST_RECIPIENT'], 'unknown-check@avalon-game.com'):
            assert connection.mail('')[0] == 250
            code, reply = connection.rcpt(recipient)
            assert 500 <= code < 600, f'Unauthorized recipient accepted: {recipient}'
            if recipient == os.environ['SMTP_TEST_RECIPIENT']:
                assert code == 554 and b'Relay access denied' in reply, 'Expected explicit relay denial'
            connection.rset()
        for recipient in (f'root@{HOST}', f'postmaster@{HOST}'):
            assert connection.mail('')[0] == 250
            assert connection.rcpt(recipient)[0] == 250
            connection.rset()
        assert connection.mail('')[0] == 250
        assert connection.rcpt(ADDRESS)[0] == 250
        if args.discard_test:
            code, reply = connection.data(
                f'From: {ADDRESS}\r\nTo: {ADDRESS}\r\n'
                'Subject: Local inbound discard check\r\n\r\n'
                'Controlled local check; null envelope sender; discard this message.\r\n')
            assert code == 250, 'Local test was not accepted'
            match = re.search(rb'queued as ([A-F0-9]+)', reply)
            assert match, 'Queue ID missing'
            queue_id = match[1].decode()
        else:
            connection.rset()  # No DATA, including for external relay checks.

    result = {'publicStartTLS': 'verified', 'publicAuth': 'disabled',
              'unauthenticatedRelay': 'rejected', 'unknownRecipient': 'rejected',
              'technicalRecipient': 'accepted', 'externalEmailsSent': 0}
    if args.discard_test:
        for _ in range(15):
            logs = docker('logs', '--since', started, CONTAINER)
            lines = [line for line in logs.splitlines() if queue_id in line]
            if any('postfix/discard' in line and 'status=sent' in line for line in lines) and any('removed' in line for line in lines):
                break
            time.sleep(1)
        else:
            raise AssertionError('Local message was not confirmed discarded and removed')
        after = {str(p) for p in (ROOT / 'data').rglob('*') if p.is_file() and p.parent.name in {'cur', 'new'}}
        assert after == before, 'Mailbox messages changed during discard test'
        result.update(localDiscard='verified', queueID=queue_id, mailboxMessagesAdded=0)
        (ROOT / 'inbound-discard-test.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
