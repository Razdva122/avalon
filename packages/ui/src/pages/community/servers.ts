export interface CommunityServer {
  id: string;
  name: string;
  logo: string;
  descriptionKey: string;
  languages: { code: string; label: string }[];
  official: boolean;
  messenger: { name: string; url: string; icon: string };
}

export const communityServers: CommunityServer[] = [
  {
    id: 'avalon',
    name: 'Avalon',
    logo: '/apple-touch-icon.png',
    descriptionKey: 'community.avalonDescription',
    languages: [
      { code: 'ru', label: 'RU' },
      { code: 'en', label: 'EN' },
    ],
    official: true,
    messenger: { name: 'Discord', url: 'https://discord.gg/DR9cEDDNdN', icon: 'fa:fa-brands fa-discord' },
  },
];
