import { mailLanguage, renderMail } from './mail';
import { passwordRecovery } from '../../../ui/src/i18n/langs/passwordRecovery';

test.each(Object.keys(passwordRecovery))('mail supports the UI locale %s', (language) => {
  expect(mailLanguage(language)).toBe(language);
  const reset = renderMail('player@example.com', language, 'https://example.com/#token');
  const changed = renderMail('player@example.com', language);
  expect(reset.text).toContain('https://example.com/#token');
  expect(reset.text).toContain('30');
  expect(changed.text).not.toContain('#token');
  if (language !== 'en') {
    expect(reset.text).not.toBe(renderMail('player@example.com', 'en', 'https://example.com/#token').text);
    expect(changed.text).not.toBe(renderMail('player@example.com', 'en').text);
  }
});

test.each([undefined, null, '', 'fr', '__proto__', 'constructor', {}, ['ru']])(
  'unsupported language %p falls back to English',
  (language) => {
    expect(mailLanguage(language)).toBe('en');
  },
);
