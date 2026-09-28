import type { TLanguage } from '@/i18n/interface';

type WikiPlayMessages = { title: string; description: string; play: string; rules: string };

export const wikiPlay: Record<TLanguage, WikiPlayMessages> = {
  en: {
    title: 'Ready to play Avalon?',
    description: 'Gather a group of 5–10 friends and play free in your browser. An account is required to play.',
    play: 'Play Avalon online',
    rules: 'Read the rules',
  },
  ru: {
    title: 'Готовы сыграть в Авалон?',
    description: 'Соберите компанию из 5–10 друзей и играйте бесплатно в браузере. Для игры нужен аккаунт.',
    play: 'Играть в Авалон онлайн',
    rules: 'Прочитать правила',
  },
  es: {
    title: '¿Listos para jugar a Avalon?',
    description: 'Reúne un grupo de 5–10 amigos y juega gratis en el navegador. Necesitas una cuenta para jugar.',
    play: 'Jugar a Avalon online',
    rules: 'Leer las reglas',
  },
  pt: {
    title: 'Prontos para jogar Avalon?',
    description: 'Reúna um grupo de 5–10 amigos e jogue de graça no navegador. É necessário ter uma conta para jogar.',
    play: 'Jogar Avalon online',
    rules: 'Ler as regras',
  },
  'zh-CN': {
    title: '准备好玩阿瓦隆了吗？',
    description: '召集5–10位朋友，在浏览器中免费游玩。游玩需要账号。',
    play: '在线玩阿瓦隆',
    rules: '阅读规则',
  },
  'zh-TW': {
    title: '準備好玩阿瓦隆了嗎？',
    description: '召集5–10位朋友，在瀏覽器中免費遊玩。遊玩需要帳號。',
    play: '線上玩阿瓦隆',
    rules: '閱讀規則',
  },
};
