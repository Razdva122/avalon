import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('hook', Path(__file__).with_name('certbot_dns.py'))
hook = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hook)

class DnsHookTests(unittest.TestCase):
    def test_refuses_other_domains_and_malformed_values(self):
        for domain, value in [('avalon-game.com', 'a'*43), (hook.DOMAIN, 'bad"value')]:
            with self.assertRaises(ValueError): hook.record(domain, value)

    def test_auth_merges_and_cleanup_deletes_only_exact_challenge(self):
        for cleanup, field in [(False, 'merges'), (True, 'deletions')]:
            with patch.object(hook, 'request_json', side_effect=[{'access_token':'test-token'}, {'done':True}]) as call:
                value = hook.record(hook.DOMAIN, 'a'*43)
                hook.update('dns12345678901234567', value, cleanup)
                self.assertEqual(call.call_args.args[2], {field:[value]})
                self.assertEqual(value['data'], ['"'+'a'*43+'"'])

    def test_failed_operation_is_not_success(self):
        with patch.object(hook, 'request_json', side_effect=[{'access_token':'test-token'}, {'done':True, 'error':{'code':7}}]):
            with self.assertRaises(RuntimeError): hook.update('dns12345678901234567', hook.record(hook.DOMAIN,'a'*43))

    def test_waits_for_all_resolvers(self):
        from types import SimpleNamespace
        with patch.object(hook.subprocess, 'run', return_value=SimpleNamespace(returncode=0,stdout='"'+'a'*43+'"\n')) as run:
            hook.wait_dns('a'*43)
            self.assertEqual(run.call_count,4)

if __name__ == '__main__': unittest.main()
