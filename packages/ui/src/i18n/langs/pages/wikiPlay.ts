import type { TLanguage } from '@/i18n/interface';

type WikiPlayMessages = { title: string; description: string; play: string; playAi: string; rules: string };

export const wikiPlay: Record<TLanguage, WikiPlayMessages> = {
  vi: {
    title: 'Sẵn sàng chơi Avalon?',
    description:
      'Chơi miễn phí trong trình duyệt cùng 5–10 người bạn, hoặc thử chơi một mình với AI. Bạn cần tài khoản để chơi.',
    play: 'Chơi Avalon trực tuyến',
    playAi: 'Chơi với AI',
    rules: 'Đọc luật chơi',
  },
  en: {
    title: 'Ready to play Avalon?',
    description:
      'Play free in your browser with 5–10 friends, or try a solo game with AI. An account is required to play.',
    play: 'Play Avalon online',
    playAi: 'Play with AI',
    rules: 'Read the rules',
  },
  ru: {
    title: 'Готовы сыграть в Авалон?',
    description:
      'Играйте бесплатно в браузере с компанией из 5–10 друзей или попробуйте игру одному против AI. Для игры нужен аккаунт.',
    play: 'Играть в Авалон онлайн',
    playAi: 'Играть с AI',
    rules: 'Прочитать правила',
  },
  es: {
    title: '¿Listos para jugar a Avalon?',
    description:
      'Juega gratis en el navegador con 5–10 amigos o prueba una partida en solitario con IA. Necesitas una cuenta para jugar.',
    play: 'Jugar a Avalon online',
    playAi: 'Jugar con IA',
    rules: 'Leer las reglas',
  },
  pt: {
    title: 'Prontos para jogar Avalon?',
    description:
      'Jogue de graça no navegador com 5–10 amigos ou experimente uma partida solo com IA. É necessário ter uma conta para jogar.',
    play: 'Jogar Avalon online',
    playAi: 'Jogar com IA',
    rules: 'Ler as regras',
  },
  'zh-CN': {
    title: '准备好玩阿瓦隆了吗？',
    description: '和5–10位朋友在浏览器中免费游玩，或尝试独自与AI对局。游玩需要账号。',
    play: '在线玩阿瓦隆',
    playAi: '与AI游玩',
    rules: '阅读规则',
  },
  'zh-TW': {
    title: '準備好玩阿瓦隆了嗎？',
    description: '和5–10位朋友在瀏覽器中免費遊玩，或嘗試獨自與AI對局。遊玩需要帳號。',
    play: '線上玩阿瓦隆',
    playAi: '與AI遊玩',
    rules: '閱讀規則',
  },
};
