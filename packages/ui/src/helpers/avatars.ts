export function avatarName(id: string, t: (key: string, values?: Record<string, string>) => string): string {
  if (id.startsWith('premium/')) return t('premiumCosmetics.' + id.slice(8));
  const role = id.replace('anime/', '');
  const special: Record<string, string> = {
    merlin_pure: 'roles.merlinPure',
    lady_of_lake: 'addons.ladyOfLake',
    lady_of_sea: 'addons.ladyOfSea',
    excalibur: 'addons.excalibur',
    good: 'avatars.goodName',
    evil: 'avatars.evilName',
    mystery: 'roles.mysteryWizard',
  };
  const name = t(special[role] || 'roles.' + role);
  return id.startsWith('anime/') ? t('avatars.animeVariant', { name }) : name;
}
