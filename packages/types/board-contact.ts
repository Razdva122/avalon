import type { BoardContactType } from './player-board';

/** Only HTTPS invitation URLs on the selected platform become clickable. */
export function boardInviteUrl(type: BoardContactType, value: string): string | null {
  if (
    !value.startsWith('https://') ||
    value.length > 512 ||
    value.split('?')[0].includes('%') ||
    /[\s\\]/.test(value) ||
    /(?:^|\/)\.{1,2}(?:\/|$)/.test(value)
  )
    return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (url.hash) return null;
    const allowedQuery =
      type === 'qqGroup'
        ? ['k', '_wv', '_wwv', 'group_code', 'authKey', 'authkey', 'ac', 'exp', 'from', 'busi_data']
        : [];
    if (
      Array.from(url.searchParams.keys()).some((key) => !allowedQuery.includes(key)) ||
      Array.from(url.searchParams.keys()).some((key) => url.searchParams.getAll(key).length > 1)
    )
      return null;
    const host = url.hostname;
    const path = url.pathname;
    let valid = false;
    if (type === 'discord')
      valid =
        (host === 'discord.gg' && /^\/[\w-]+\/?$/.test(path)) ||
        (host === 'discord.com' && /^\/invite\/[\w-]+\/?$/.test(path));
    if (type === 'telegram')
      valid =
        host === 't.me' &&
        (/^\/(?:\+[\w-]+|joinchat\/[\w-]+)\/?$/.test(path) ||
          (/^\/[A-Za-z][\w]{3,31}\/?$/.test(path) &&
            ![
              'share',
              'proxy',
              'socks',
              'login',
              'addstickers',
              'addemoji',
              'addlist',
              'setlanguage',
              'boost',
            ].includes(path.split('/')[1].toLowerCase())));
    if (type === 'line') valid = host === 'line.me' && /^\/(?:R\/)?ti\/(?:g|g2)\/[\w-]+\/?$/.test(path);
    if (type === 'qqGroup')
      valid =
        (host === 'jq.qq.com' && path === '/' && /^[\w-]+$/.test(url.searchParams.get('k') || '')) ||
        (host === 'qun.qq.com' &&
          path === '/universal-share/share' &&
          /^\d+$/.test(url.searchParams.get('group_code') || ''));
    return valid ? url.href : null;
  } catch {
    return null;
  }
}
export function validBoardContact(type: BoardContactType, value: string, group: boolean): boolean {
  if (group && boardInviteUrl(type, value)) return true;
  return (
    value.length > 0 &&
    value.length <= 80 &&
    /^[A-Za-z0-9_@.+#-]+$/.test(value) &&
    (!['qq', 'qqGroup'].includes(type) || /^\d{4,20}$/.test(value))
  );
}
