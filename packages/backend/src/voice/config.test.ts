import { voiceConfig } from './config';
test('voice is opt-in and disabled without configuration', () => {
  expect(voiceConfig({})).toBeUndefined();
});
test('enabled production voice requires secrets and secure public endpoint', () => {
  expect(() => voiceConfig({ VOICE_ENABLED: 'true' })).toThrow();
  const env = {
    VOICE_ENABLED: 'true',
    NODE_ENV: 'production',
    LIVEKIT_API_KEY: 'key',
    LIVEKIT_API_SECRET: 'a'.repeat(40),
    LIVEKIT_INTERNAL_URL: 'http://10.0.0.5:7880',
    LIVEKIT_PUBLIC_URL: 'wss://voice.example',
  };
  expect(voiceConfig(env)?.gatewayHost).toBe('127.0.0.1');
  expect(() => voiceConfig({ ...env, LIVEKIT_PUBLIC_URL: 'ws://voice.example' })).toThrow();
  expect(() => voiceConfig({ ...env, LIVEKIT_PUBLIC_URL: 'wss://user:pass@voice.example' })).toThrow();
  expect(() => voiceConfig({ ...env, VOICE_GATEWAY_PORT: '-1' })).toThrow();
});
