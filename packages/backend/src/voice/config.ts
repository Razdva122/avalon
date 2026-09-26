export interface VoiceConfig {
  apiKey: string;
  apiSecret: string;
  internalUrl: string;
  publicUrl: string;
  gatewayHost: string;
  gatewayPort: number;
}
export function voiceConfig(env = process.env): VoiceConfig | undefined {
  if (env.VOICE_ENABLED !== 'true') return;
  const {
    LIVEKIT_API_KEY: apiKey,
    LIVEKIT_API_SECRET: apiSecret,
    LIVEKIT_INTERNAL_URL: internalUrl,
    LIVEKIT_PUBLIC_URL: publicUrl,
  } = env;
  if (!apiKey || !apiSecret || apiSecret.length < 32 || !internalUrl || !publicUrl)
    throw Error('Invalid voice configuration');
  const upstream = new URL(internalUrl);
  const publicEndpoint = new URL(publicUrl);
  if (
    !['http:', 'https:'].includes(upstream.protocol) ||
    !['ws:', 'wss:'].includes(publicEndpoint.protocol) ||
    upstream.username ||
    upstream.password ||
    publicEndpoint.username ||
    publicEndpoint.password ||
    publicEndpoint.search ||
    publicEndpoint.hash ||
    upstream.search ||
    upstream.hash ||
    upstream.pathname !== '/' ||
    publicEndpoint.pathname !== '/'
  )
    throw Error('Invalid voice URLs');
  if (env.NODE_ENV === 'production' && publicEndpoint.protocol !== 'wss:') throw Error('Voice requires TLS');
  const gatewayPort = Number(env.VOICE_GATEWAY_PORT || 7882);
  if (!Number.isInteger(gatewayPort) || gatewayPort < 1 || gatewayPort > 65535)
    throw Error('Invalid voice gateway port');
  return { apiKey, apiSecret, internalUrl, publicUrl, gatewayHost: env.VOICE_GATEWAY_HOST || '127.0.0.1', gatewayPort };
}
