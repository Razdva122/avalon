import type { TLanguage } from '@/i18n/interface';
import { Dictionary } from '@avalon/types';

export const about: { [key in TLanguage]: Dictionary<string> } = {
  en: {
    title: 'About',
    content:
      'Welcome to <b>avalon-game.com</b>, your premier destination for playing <b>"Avalon: The Resistance"</b> online with friends and fellow enthusiasts. Our platform offers a seamless and immersive gaming experience, entirely free of charge and without the distraction of advertisements.',
    description:
      '<b>"Avalon: The Resistance"</b> is a captivating board game of strategy and deception, set in the legendary era of King Arthur and his Knights of the Round Table. Designed for 5 to 10 players, it invites you into a divided world where you\'re either a loyal servant of Arthur striving to protect the kingdom or a devious minion of Mordred plotting its downfall. The game is celebrated for its incorporation of secret identities, strategic deception, and the deductive challenge of discerning allies from foes.',
    roles:
      "Our site replicates the full spectrum of roles found in the traditional board game, including {merlin}, {percival}, {troublemaker}, {oberon}, {lunatic}, {brute}, {mordred}, {morgana}, {trickster}, {goodLancelot} and {evilLancelot} ensuring an authentic Avalon experience. We've also integrated the beloved game expansions, {ladyOfLake} and {excalibur} to enrich your gameplay.",
    extraRoles:
      'Exclusive to our platform are additional roles not found in the original game - {merlinPure}, {guinevere}, {witch}, {cleric}, {revealer} and {tristan} + {isolde} (the Lovers) - providing new dynamics and strategies for you and your team to explore.',
    features:
      "To enhance your strategic play, we offer a History feature, allowing players to review past moves and better strategize against the opposition. Additionally, our Spoiler Mode ensures that you can play in the same physical space as other players without revealing your role or compromising the game's outcome.",
    code: 'The project code can be viewed on ',
    contact: 'You can contact me via ',
    disclaimerTitle: 'Disclaimer',
    disclaimerContent:
      'This is a fan-based, non-commercial project created for the love of the game. All content, including the rules we follow, is inspired by the original tabletop game, but all graphics and illustrations are uniquely ours. This site is not affiliated with or endorsed by the official publishers. We respect the original creators and recognize that all related trademarks and copyrights belong to their respective owners.',
  },
  ru: {
    title: 'О сайте',
    content:
      'Добро пожаловать на <b>avalon-game.com</b>, ваше место №1 для игры в <b>"Avalon: The Resistance"</b> онлайн с друзьями и единомышленниками. Наша платформа предлагает беспрепятственное и увлекательное игровое пространство, полностью бесплатно и без отвлекающей рекламы.',
    description:
      '<b>"Avalon: The Resistance"</b> — это увлекательная настольная игра стратегии и обмана, происходящая в легендарной эпохе Короля Артура и его Рыцарей Круглого Стола. Игра рассчитана на 5–10 игроков и приглашает вас в разделённый мир, где вы либо верный слуга Артура, стремящийся защитить королевство, либо хитрый подручный Мордреда, замышляющий его падение. Игра известна благодаря внедрению секретных личностей, стратегических обманов и дедуктивной задачи различения союзников от врагов.',
    roles:
      'Наш сайт имеет большую часть доступных ролей, найденных в традиционной настольной игре, включая {merlin}, {percival}, {troublemaker}, {oberon}, {lunatic}, {brute}, {mordred}, {morgana}, {trickster}, {goodLancelot} и {evilLancelot}, обеспечивая подлинный опыт игры в Avalon. Мы также интегрировали популярные расширения игры, {ladyOfLake} и {excalibur}, чтобы обогатить ваш игровой процесс.',
    extraRoles:
      'Эксклюзивно для нашей платформы добавлены дополнительные роли, отсутствующие в оригинальной игре — {merlinPure}, {guinevere}, {witch}, {cleric}, {revealer} и {tristan} + {isolde} (влюблённые), — предоставляя новые динамики и стратегии для изучения вами и вашей командой.',
    features:
      'Для улучшения вашей стратегической игры мы предлагаем функцию Истории, позволяющую игрокам просматривать прошлые ходы и лучше выстраивать стратегию против оппонентов. Кроме того, наш режим Спойлера обеспечивает возможность играть в одной физической зоне с другими игроками, не раскрывая свою роль и не компрометируя итоги игры.',
    code: 'Код проекта можно увидеть на ',
    contact: 'Вы можете связаться со мной через ',
    disclaimerTitle: 'Отказ от ответственности',
    disclaimerContent:
      'Это фанатский, некоммерческий проект, созданный из любви к игре. Весь контент, включая соблюдаемые нами правила, вдохновлён оригинальной настольной игрой, но все изображения и иллюстрации уникальны и принадлежат нам. Этот сайт не связан и не поддерживается официальными издателями. Мы уважаем оригинальных создателей и признаем, что все связанные товарные знаки и авторские права принадлежат их владельцам.',
  },
  'zh-TW': {
    title: '關於',
    content:
      '歡迎來到 <b>avalon-game.com</b>，這是您與朋友及愛好者一同在線上遊玩 <b>"Avalon: The Resistance"</b> 的首選平台。我們的平台提供流暢且沉浸式的遊戲體驗，完全免費且無廣告打擾。',
    description:
      '<b>"Avalon: The Resistance"</b> 是一款吸引人的策略與欺騙的桌上遊戲，設置在亞瑟王和他的圓桌武士傳奇時代。適合5到10名玩家，邀請您進入一個分裂的世界，您要么是奮力保護王國的亞瑟忠臣，要么是謀劃其垮台的莫德雷德陰謀者。這款遊戲因其導入秘密身份、策略性欺騙和辨別盟友和敵人的推理挑戰而受到讚譽。',
    roles:
      '我們的網站複製了傳統桌上遊戲中所有的角色，包括 {merlin}, {percival}, {troublemaker}, {oberon}, {lunatic}, {brute}, {mordred}, {morgana}, {trickster}, {goodLancelot} 和 {evilLancelot}，確保真實的阿瓦隆體驗。我們還整合了受歡迎的遊戲擴展， {ladyOfLake} 和 {excalibur}，以豐富您的遊戲體驗。',
    extraRoles:
      '我們平台獨有的原始遊戲中未出現的附加角色 - {merlinPure}, {guinevere}, {witch}, {cleric}, {revealer} 和 {tristan} + {isolde}（戀人） - 為您和您的團隊提供新的動態和策略探索。',
    features:
      '為增強您的策略遊戲，我們提供歷史功能，允許玩家查看過去的動作，以便更好地針對對手策略。此外，我們的劇透模式可確保您能與其他玩家在同一實體空間中遊玩，而不會洩露您的角色或影響遊戲結果。',
    code: '項目的代碼可以在上查看 ',
    contact: '您可以通過以下方式聯繫我 ',
    disclaimerTitle: '免責聲明',
    disclaimerContent:
      '這是一個基於愛好的粉絲，非商業項目。所有內容，包括我們遵循的規則，均受原始桌上遊戲啟發，但所有圖形和插圖均由我們獨自創造。本站與正式發布商無關，也未經授權。我們尊重原創作者並認識到所有相關商標和版權屬於其各自所有者。',
  },
  'zh-CN': {
    title: '关于',
    content:
      '欢迎来到 <b>avalon-game.com</b>，这是您与朋友及爱好者一同在线上游玩 <b>"Avalon: The Resistance"</b> 的首选平台。我们的平台提供流畅且沉浸式的游戏体验，完全免费且无广告打扰。',
    description:
      '<b>"Avalon: The Resistance"</b> 是一款吸引人的策略与欺骗的桌面游戏，设置在亚瑟王和他的圆桌骑士传奇时代。适合5到10名玩家，邀请您进入一个分裂的世界，您要么是努力保护王国的亚瑟忠臣，要么是谋划其垮台的莫德雷德阴谋者。这款游戏因其导入秘密身份、策略性欺骗和辨别盟友和敌人的推理挑战而受到赞誉。',
    roles:
      '我们的网站复制了传统桌面游戏中的所有角色，包括 {merlin}, {percival}, {troublemaker}, {oberon}, {lunatic}, {brute}, {mordred}, {morgana}, {trickster}, {goodLancelot} 和 {evilLancelot}，确保真实的阿瓦隆体验。我们还整合了受欢迎的游戏扩展， {ladyOfLake} 和 {excalibur}，以丰富您的游戏体验。',
    extraRoles:
      '我们平台独有的原始游戏中未出现的附加角色 - {merlinPure}, {guinevere}, {witch}, {cleric}, {revealer} 和 {tristan} + {isolde}（恋人） - 为您和您的团队提供新的动态和策略探索。',
    features:
      '为增强您的策略游戏，我们提供历史功能，允许玩家查看过去的动作，以便更好地针对对手策略。此外，我们的剧透模式可确保您能与其他玩家在同一实体空间中游玩，而不会泄露您的角色或影响游戏结果。',
    code: '项目的代码可以在上查看 ',
    contact: '您可以通过以下方式联系我 ',
    disclaimerTitle: '免责声明',
    disclaimerContent:
      '这是一个基于爱好的粉丝，非商业项目。所有内容，包括我们遵循的规则，均受原始桌面游戏启发，但所有图形和插图均由我们独自创造。本站与正式发布商无关，也未经授权。我们尊重原创作者并认识到所有相关商标和版权属于其各自所有者。',
  },
  es: {
    title: 'Acerca de',
    content:
      'Bienvenido a <b>avalon-game.com</b>, tu principal destino para jugar <b>"Avalon: La Resistencia"</b> en línea con amigos y otros entusiastas. Nuestra plataforma ofrece una experiencia de juego fluida e inmersiva, completamente gratuita y sin distracciones de anuncios.',
    description:
      '<b>"Avalon: La Resistencia"</b> es un fascinante juego de mesa de estrategia y engaño, ambientado en la legendaria era del Rey Arturo y sus Caballeros de la Mesa Redonda. Diseñado para 5 a 10 jugadores, te invita a un mundo dividido donde eres un leal servidor de Arturo esforzándote por proteger el reino o un astuto Esbirros de Mordred tramando su caída. El juego es célebre por incorporar identidades secretas, el engaño estratégico y el desafío deductivo de discernir aliados de enemigos.',
    roles:
      'Nuestro sitio replica todo el espectro de roles encontrados en el juego de mesa tradicional, incluyendo {merlin}, {percival}, {troublemaker}, {oberon}, {lunatic}, {brute}, {mordred}, {morgana}, {trickster}, {goodLancelot} y {evilLancelot}, asegurando una experiencia auténtica de Avalon. También hemos integrado las expansiones del juego, {ladyOfLake} y {excalibur} para enriquecer tu experiencia de juego.',
    extraRoles:
      'Exclusivamente en nuestra plataforma hay roles adicionales que no están en el juego original - {merlinPure}, {guinevere}, {witch}, {cleric}, {revealer} y {tristan} + {isolde} (los Amantes) - aportando nuevas dinámicas y estrategias para que tú y tu equipo exploren.',
    features:
      'Para mejorar tu juego estratégico, ofrecemos una función de Historia, que permite a los jugadores revisar movimientos pasados y mejorar su estrategia contra la oposición. Además, nuestro Modo Spoiler asegura que puedas jugar en el mismo espacio físico que otros jugadores sin revelar tu rol ni comprometer el resultado del juego.',
    code: 'El código del proyecto se puede ver en ',
    contact: 'Puedes contactarme a través de ',
    disclaimerTitle: 'Aviso legal',
    disclaimerContent:
      'Este es un proyecto no comercial creado por fans por amor al juego. Todo el contenido, incluidas las reglas que seguimos, está inspirado en el juego de mesa original, pero todos los gráficos e ilustraciones son únicos nuestros. Este sitio no está afiliado ni respaldado por los editores oficiales. Respetamos a los creadores originales y reconocemos que todas las marcas registradas y derechos de autor relacionados pertenecen a sus respectivos propietarios.',
  },
};
