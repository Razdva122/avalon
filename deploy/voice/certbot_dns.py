#!/usr/bin/env python3
"""Certbot DNS-01 hook; VM identity needs dns.editor on its dedicated challenge zone only."""
import json
import os
import re
import subprocess
import sys
import time
from urllib.request import Request, build_opener, ProxyHandler

DOMAIN = 'turn.avalon-game.com'
NAME = 'voice-cert-validation.avalon-game.com.'
API = 'https://dns.api.cloud.yandex.net/dns/v1/zones/'
METADATA = 'http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token'
OPENER = build_opener(ProxyHandler({}))


def request_json(url, headers=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = Request(url, data=data, headers=headers or {})
    with OPENER.open(request, timeout=15) as response:
        return json.load(response)


def record(domain, validation):
    if domain != DOMAIN or not re.fullmatch(r'[A-Za-z0-9_-]{43}', validation):
        raise ValueError('Unexpected certificate domain or validation format')
    return {'name': NAME, 'type': 'TXT', 'ttl': '60', 'data': ['"' + validation + '"']}


def update(zone, value, cleanup=False):
    if not re.fullmatch(r'[a-z0-9]{10,40}', zone):
        raise ValueError('Invalid challenge zone ID')
    token = request_json(METADATA, {'Metadata-Flavor': 'Google'})['access_token']
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    result = request_json(API + zone + ':upsertRecordSets', headers,
                          {'deletions' if cleanup else 'merges': [value]})
    for _ in range(30):
        if result.get('error'):
            raise RuntimeError('DNS operation failed')
        if result.get('done'):
            return
        operation = result.get('id', '')
        if not re.fullmatch(r'[a-z0-9]{10,40}', operation):
            raise RuntimeError('Invalid DNS operation response')
        time.sleep(2)
        result = request_json('https://operation.api.cloud.yandex.net/operations/' + operation, headers)
    raise RuntimeError('DNS operation did not complete')


def wait_dns(validation):
    # Check authoritative servers and independent recursive resolvers before ACME submission.
    servers = ('ns1.yandexcloud.net', 'ns2.yandexcloud.net', '1.1.1.1', '8.8.8.8')
    for _ in range(60):
        ready = True
        for server in servers:
            result = subprocess.run(['dig', '+time=2', '+tries=1', '+short', '@' + server, 'TXT', NAME],
                                    capture_output=True, text=True, timeout=5, check=False)
            if result.returncode or '"' + validation + '"' not in result.stdout.splitlines():
                ready = False
                break
        if ready:
            return
        time.sleep(10)
    raise RuntimeError('DNS propagation timed out')


def main():
    action = sys.argv[1] if len(sys.argv) == 2 else ''
    if action not in ('auth', 'cleanup'):
        raise ValueError('Expected auth or cleanup')
    value = record(os.environ.get('CERTBOT_DOMAIN', ''), os.environ.get('CERTBOT_VALIDATION', ''))
    with open('/etc/avalon-voice-dns.json') as stream:
        zone = json.load(stream)['zone_id']
    update(zone, value, action == 'cleanup')
    if action == 'auth':
        wait_dns(os.environ['CERTBOT_VALIDATION'])


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print API bodies, token values or HTTP headers.
        print('Voice certificate DNS hook failed: ' + type(error).__name__, file=sys.stderr)
        sys.exit(1)
