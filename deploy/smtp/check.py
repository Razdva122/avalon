#!/usr/bin/env python3
"""Check real SMTPS authentication and relay restrictions without sending mail."""
import json
from pathlib import Path
import smtplib
import socket
import ssl

ROOT = Path('/opt/avalon/smtp')
HOST = 'avalon-prod.avalon-game.com'


def client():
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    connection = smtplib.SMTP(local_hostname=HOST, timeout=10)
    connection.sock = context.wrap_socket(socket.create_connection(('127.0.0.1', 1465), timeout=10), server_hostname=HOST)
    assert connection.getreply()[0] == 220, 'SMTP greeting failed'
    assert connection.ehlo()[0] == 250, 'EHLO failed'
    return connection


def no_relay(connection, sender):
    code, _ = connection.mail(sender)
    if code == 250:
        code, _ = connection.rcpt('lexur-02@yandex.ru')
    connection.rset()
    assert 500 <= code < 600, 'Unauthorized sender or relay was accepted'


def main():
    with client() as connection:
        no_relay(connection, 'security@avalon-game.com')
    env = dict(line.split('=', 1) for line in (ROOT / 'backend-smtp.env').read_text().splitlines() if '=' in line)
    with client() as connection:
        try:
            connection.login(env['SMTP_USER'], 'deliberately-incorrect-password')
        except smtplib.SMTPAuthenticationError as error:
            assert error.smtp_code == 535, 'Unexpected authentication response'
        else:
            raise AssertionError('Invalid credentials were accepted')
    with client() as connection:
        assert connection.login(env['SMTP_USER'], env['SMTP_PASSWORD'])[0] == 235
        no_relay(connection, 'someone-else@avalon-game.com')
        assert connection.mail('security@avalon-game.com')[0] == 250
        assert connection.rcpt('lexur-02@yandex.ru')[0] == 250
        connection.rset()  # Never issue DATA; this check sends no message.
    print(json.dumps({'tls': 'verified', 'valid_auth': 'passed', 'invalid_auth': 'rejected', 'unauthenticated_relay': 'rejected', 'sender_spoofing': 'rejected', 'emails_sent': 0}))


if __name__ == '__main__':
    main()
