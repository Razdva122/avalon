import type { GuideId, Guide, GuideCopy } from '../content';

const secretHitlerRules = {
  label: 'Reglas oficiales de Secret Hitler',
  url: 'https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf',
};
const secretHitlerOnline = { label: 'Secret Hitler.io', url: 'https://secrethitler.io/' };
const werewolfRules = {
  label: 'Ultimate Werewolf de Bézier Games',
  url: 'https://beziergames.com/products/ultimate-werewolf',
};
const oneNight = {
  label: 'One Night Ultimate Werewolf de Bézier Games',
  url: 'https://beziergames.com/products/one-night-ultimate-werewolf',
};
const browserWerewolf = {
  label: 'Werewolf (Hombres Lobo) en BoardGameJoin',
  url: 'https://boardgamejoin.com/en/games/werewolf/',
};
const amongUs = { label: 'Among Us de Innersloth', url: 'https://www.innersloth.com/games/among-us/' };

export const guides: Record<GuideId, Guide> = {
  social_deduction_games_online: {
    slug: 'social-deduction-games-online',
    breadcrumb: 'Juegos de roles ocultos online',
    title: 'Juegos de roles ocultos online para jugar con amigos',
    lead: 'Compara roles ocultos online: Avalon, Secret Hitler y Hombres Lobo en navegador; Among Us requiere instalación. Avalon evita la eliminación temprana de Los Hombres Lobo de Castronegro.',
    preview: true,
    table: {
      caption: 'Elige un juego para la próxima sesión de tu grupo',
      columns: ['Juego y tamaño del grupo', 'Elígelo si buscas', 'Diferencia práctica'],
      rows: [
        {
          title: 'Avalon · 5–10 personas, o solo / con amigos y bots',
          cells: [
            'Debate, votaciones públicas y sabotaje secreto de misiones.',
            'Partidas normales gratuitas para 5–10 personas con cuenta. Juega solo o invita a amigos y deja que los bots ocupen los asientos libres; elige el tamaño de mesa y el modo disponibles en la configuración. Nadie queda eliminado durante las misiones.',
          ],
        },
        {
          title: 'Secret Hitler · 5–10',
          cells: [
            'Elegir gobiernos y debatir qué ha pasado con las cartas de política.',
            'Puedes jugar en el navegador en Secret Hitler.io, que ofrece cuentas y opciones de partidas privadas. Las ejecuciones pueden eliminar a jugadores.',
          ],
          source: secretHitlerOnline,
        },
        {
          title: 'Hombres Lobo (Werewolf) · 4–30 en BoardGameJoin',
          cells: [
            'El ciclo clásico de día y noche con acusaciones y roles especiales.',
            'Esta versión para navegador admite grupos de 5–10 jugadores. Resuelve las acciones nocturnas y las votaciones, mientras que el anfitrión hace avanzar las fases; los jugadores pueden quedar eliminados.',
          ],
          source: browserWerewolf,
        },
        {
          title: 'Among Us · 4–15',
          cells: [
            'Moverse, completar tareas y construir coartadas.',
            'Es un juego que hay que instalar, en lugar de una opción para navegador. Comprueba las plataformas y la configuración de chat de todos antes de la sesión.',
          ],
          source: amongUs,
        },
      ],
    },
    sections: [
      {
        title: 'Avalon o Secret Hitler: misiones frente a políticas',
        paragraphs: [
          'Elige Avalon si a tu grupo le gusta reconsiderar las mismas decisiones de confianza. Todos votan sobre el equipo propuesto, pero solo ese equipo entrega cartas de misión en secreto. Una misión fallida concentra las sospechas en sus miembros; una misión exitosa puede incluir a un jugador del Mal que haya decidido no sabotearla.',
          'Elige Secret Hitler si a tu grupo le gustan las versiones contradictorias de un intercambio privado de cartas. Un Presidente y un Canciller eligen una política entre las cartas robadas, así que importan tanto el resultado como sus explicaciones. El mazo de políticas introduce una incertidumbre que no existe en las cartas de misión del Avalon básico.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Hombres Lobo o Among Us: noche frente a movimiento',
        paragraphs: [
          'Las versiones clásicas de Hombres Lobo y Mafia giran en torno a eliminar sospechosos e interpretar las acciones nocturnas. Para un grupo a distancia, usa una versión que gestione las reglas elegidas o acordad quién moderará. La opción de BoardGameJoin mencionada arriba automatiza las acciones ocultas, pero el anfitrión sigue haciendo avanzar las fases del juego.',
          'Among Us añade acción entre los debates: los Tripulantes realizan tareas mientras los Impostores sabotean y matan. En las reuniones, lo que han visto los jugadores se convierte en una acusación. Encaja con amigos que quieren algo que hacer entre debates, mientras que Avalon mantiene al grupo centrado en la decisión compartida sobre la misión.',
        ],
        source: amongUs,
      },
      {
        title: 'De Los Hombres Lobo de Castronegro a Avalon sin eliminación temprana',
        paragraphs: [
          'Avalon mantiene a todos los jugadores en el debate y en cada votación de equipo durante las misiones. Quedarte fuera de una misión es temporal: sigues votando, observando el resultado y puedes ser elegido la próxima vez. El asesinato es una decisión al final de la partida, no una sucesión de jugadores que pasan el resto de la sesión sin participar.',
          'No consideres que todas las versiones de Hombres Lobo eliminan jugadores durante la partida. One Night Ultimate Werewolf es un juego distinto para 3–10 jugadores, con una noche, un debate y sin eliminación temprana. La aplicación de navegador de su editorial sirve como ayuda de narración; por sí sola no es una sala completa para partidas multijugador a distancia.',
        ],
        source: oneNight,
      },
      {
        title: 'Cómo organizar una partida online con amigos',
        paragraphs: [
          'Cuenta quién va a participar realmente, elige un idioma común y decidid cómo vais a hablar antes de enviar el enlace del juego. Para jugar a Avalon aquí, cada amigo necesita su propia cuenta y dispositivo. Empieza con roles conocidos y deja los roles opcionales y las expansiones para una partida posterior.',
          'Si hay menos de cinco personas listas, puedes jugar solo o invitar a amigos y dejar que los bots ocupen los asientos libres. Para una partida normal entre personas, acordad otro momento o buscad más jugadores. Los tablones de jugadores y grupos ayudan a ponerse en contacto; no llenan una sala automáticamente ni prometen una partida inmediata.',
        ],
      },
      {
        title: 'Aprende Avalon con bots antes de la sesión con tu grupo',
        paragraphs: [
          'No necesitas reunir a un grupo completo para probar la dinámica de las misiones. Jugar solo con bots te permite proponer equipos, votar y ver los resultados de las misiones; el modo guiado Primera partida te ayuda a aprender. También puedes invitar a amigos y dejar que los bots ocupen los asientos libres, eligiendo el tamaño de mesa y el modo en la configuración.',
          'Usa una partida con bots para aprender cómo encajan la información de Merlín y el asesinato final con las misiones, y después enseña esas decisiones a tu grupo de personas. La configuración de IA de la sala de espera muestra qué modos y tamaños de mesa están disponibles en ese momento.',
        ],
      },
      {
        title: 'Online no siempre significa jugar a distancia',
        paragraphs: [
          'Una web que reparte roles pasando un móvil por la mesa puede servir para una reunión presencial sin ofrecer una sala para amigos a distancia. Comprueba que cada participante pueda entrar desde su dispositivo. Avalon aquí funciona en el navegador; Among Us requiere que todos instalen el juego en una plataforma compatible.',
          'En Avalon, las partidas normales de 5–10 personas son gratuitas y cada jugador necesita una cuenta. Si quieres jugar solo o con amigos y bots, consulta antes la configuración: muestra los modos disponibles y los tamaños que requieren Premium. Los debates de los bots están en inglés, ruso y chino tradicional; el idioma de esta guía no amplía esa lista.',
        ],
      },
    ],
  },
  games_like_secret_hitler: {
    slug: 'games-like-secret-hitler',
    breadcrumb: 'Juegos similares a Secret Hitler',
    title: 'Juegos similares a Secret Hitler: qué cambia en Avalon',
    lead: 'Avalon es una alternativa a Secret Hitler para 5–10 personas: cambia las políticas por misiones. Mantiene los roles ocultos y las votaciones en grupo, sin eliminación temprana.',
    table: {
      caption: 'Secret Hitler y Avalon: las decisiones que cambian',
      columns: ['Decisión', 'Secret Hitler', 'Avalon'],
      rows: [
        {
          title: 'Qué apruebas',
          cells: [
            'Un Presidente y un candidato a Canciller.',
            'Un equipo cuyo tamaño depende de la misión y del número de jugadores.',
          ],
        },
        {
          title: 'Acción oculta',
          cells: [
            'La pareja elegida roba y descarta políticas.',
            'Cada jugador seleccionado entrega una carta de misión en secreto.',
          ],
        },
        {
          title: '¿Qué puede explicar un mal resultado?',
          cells: [
            'Las políticas elegidas y las cartas disponibles al robar.',
            'En el juego básico, al menos un miembro del equipo del Mal que elige Fallar.',
          ],
        },
        {
          title: 'Participación',
          cells: [
            'Las ejecuciones pueden eliminar a jugadores antes de que termine la partida.',
            'Todos siguen debatiendo y votando durante las misiones.',
          ],
        },
        {
          title: 'Final especial',
          cells: [
            'Elegir a Hitler como Canciller después de tres políticas Fascistas puede terminar la partida.',
            'Tras tres misiones exitosas, el Mal aún puede ganar si identifica a Merlín.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'De votar un gobierno a votar un equipo de misión',
        paragraphs: [
          'En ambos juegos, una mayoría debe aprobar una propuesta y un empate la rechaza. Sigue siendo útil fijarse en quién apoyó a quién. En Avalon, pregunta por qué alguien apoya al equipo completo, en lugar de tratar al líder como la única persona bajo sospecha.',
          'En Secret Hitler, las políticas robadas pueden dejar incluso a cargos leales sin una política Liberal que promulgar. Avalon básico no tiene un mazo de políticas compartido: los miembros del Bien deben elegir Éxito en la misión, mientras que los del Mal pueden elegir Éxito o Fallar. Por tanto, una carta de Fallar te dice algo sobre el equipo, aunque no identifica a la persona que la jugó.',
        ],
        source: secretHitlerRules,
      },
      {
        title: 'Por qué una misión exitosa no demuestra inocencia',
        paragraphs: [
          'Imagina que Alicia y Bruno van a la primera misión en una partida de cinco jugadores. Basta con tres votos a favor para enviarlos. Si la misión falla, al menos uno de ellos pertenece al Mal en la configuración básica. Si tiene éxito, cualquiera de los dos podría seguir siendo del Mal y haber elegido Éxito para ganarse la confianza.',
          'Compara sus votos y propuestas de equipo posteriores con ese resultado. Repetir un equipo que tuvo éxito es una decisión que hay que debatir, no una regla que confirme que esos jugadores son del Bien. En la cuarta misión con siete o más jugadores se necesitan dos cartas de Fallar; una sola carta de Fallar puede aparecer en un resultado exitoso.',
        ],
      },
      {
        title: 'Merlín invierte el problema de las identidades ocultas',
        paragraphs: [
          'En Secret Hitler, la identidad de un jugador concreto del bando fascista es clave para una condición de victoria por elección. Avalon da a un jugador del Bien, Merlín, información sobre el Mal al preparar la partida. Merlín debe guiar al Bien sin hacer evidente lo que sabe, porque después de tres misiones exitosas el Mal sigue teniendo una oportunidad de asesinato.',
          'Evita trasladar la idea de que «los jugadores del Bien deberían contarlo todo» a todas las situaciones. Una explicación segura puede ayudar a ganar una misión y, a la vez, ayudar al Mal a identificar a Merlín. La guía de roles explica a quién ve Merlín y qué roles opcionales modifican esa información.',
        ],
      },
      {
        title: 'Cuándo elegir Avalon como alternativa a Secret Hitler',
        paragraphs: [
          'Prueba Avalon si tu grupo quiere equipos de distintos tamaños, pruebas procedentes de las misiones y participación continua. Sigue con Secret Hitler si lo que más disfrutan tus amigos es la incertidumbre de las políticas y los poderes ejecutivos. Ambos tienen versiones para navegador; poder jugar en el navegador no es por sí solo un motivo para cambiar.',
          'Para una partida normal de Avalon entre personas aquí, reúne a 5–10 jugadores, pide a todos que inicien sesión y mantén sencillos los roles opcionales y las expansiones. También puedes aprender primero con bots. Lee las diferencias de la plataforma que aparecen más abajo antes de dar por hecho que las reglas de propuestas rechazadas o asesinato funcionan exactamente como en el juego de mesa físico.',
        ],
        source: { label: 'Reglas y versión para navegador de Secret Hitler.io', url: 'https://secrethitler.io/rules' },
      },
      {
        title: 'Prueba el cambio primero con bots',
        paragraphs: [
          'Si tus amigos de Secret Hitler aún no están conectados, prueba Avalon solo con bots. El modo guiado Primera partida te ayuda a aprender la votación de equipo y las cartas de misión sin organizar un grupo completo. Observa cómo una misión exitosa puede generar confianza sin demostrar que alguien pertenece al Bien.',
          'Las partidas con bots también te permiten conocer a Merlín y el asesinato final antes de explicárselos a tus amigos. Como alternativa, puedes invitar a amigos y dejar que los bots ocupen los asientos libres. Elige el tamaño de mesa y el modo en la configuración; allí se muestra la disponibilidad actual y se indican los tamaños que requieren Premium.',
        ],
      },
      {
        title: 'Una alternativa a Secret Hitler que puedes probar en el navegador',
        paragraphs: [
          'Para probar Avalon aquí no necesitas descargar una aplicación. Cada amigo entra desde su propio dispositivo y con su cuenta. Una sala normal requiere 5–10 personas; compartir el enlace no busca jugadores ni completa el grupo automáticamente.',
          'Antes de cambiar la noche de juegos de tu grupo, decide si vais a jugar una partida gratuita entre personas o a aprender solos o con amigos y bots. Jugar con IA muestra la disponibilidad y los tamaños que requieren Premium; comprueba también que el grupo pueda seguir un debate en inglés, ruso o chino tradicional.',
        ],
      },
    ],
  },
  avalon_vs_werewolf: {
    slug: 'avalon-vs-werewolf',
    breadcrumb: 'Avalon vs Hombres Lobo',
    title: 'De Los Hombres Lobo de Castronegro a Avalon: sin eliminación temprana',
    lead: 'Avalon es una alternativa a Los Hombres Lobo de Castronegro para 5–10 personas: votas equipos sin eliminación temprana. Elígelo si prefieres deducir por misiones y votos a las acciones nocturnas.',
    table: {
      caption: 'Hombres Lobo y Mafia: versiones clásicas frente a Avalon básico',
      columns: ['Parte del juego', 'Hombres Lobo / Mafia (versiones clásicas)', 'Avalon'],
      rows: [
        {
          title: 'Decisión del grupo',
          cells: ['Votar para eliminar a un sospechoso.', 'Aprobar o rechazar el equipo de misión propuesto.'],
        },
        {
          title: 'Acción oculta',
          cells: [
            'Acciones nocturnas como ataques e investigaciones; los detalles dependen de las reglas.',
            'Los jugadores seleccionados entregan cartas de misión de Éxito o Fallar.',
          ],
        },
        {
          title: 'Cuando sospechan de ti',
          cells: [
            'La eliminación puede poner fin a tu participación activa.',
            'Sigues participando en el debate y en cada votación de equipo.',
          ],
        },
        {
          title: 'Pruebas a lo largo de la partida',
          cells: [
            'Debates, votos, resultados nocturnos e información de los roles.',
            'Propuestas de equipo, votos públicos de aprobación y resultados de las misiones.',
          ],
        },
        {
          title: 'Moderación',
          cells: [
            'Una partida clásica presencial suele tener un moderador; las herramientas online pueden gestionar las acciones.',
            'Esta plataforma gestiona los roles secretos, las votaciones y los resultados de las misiones.',
          ],
        },
      ],
    },
    sections: [
      {
        title: 'Votación de equipo frente a eliminación de jugadores',
        paragraphs: [
          'En la versión clásica de Hombres Lobo, la aldea debate sobre los sospechosos durante el día y el enemigo oculto actúa por la noche. Los jugadores eliminados normalmente dejan de participar en el debate activo y las votaciones. Mafia tiene muchas reglas locales, así que acordad la versión en lugar de suponer que todos los roles y condiciones de victoria coinciden.',
          'En Avalon, dejar a alguien fuera de un equipo no lo elimina de la partida. Puede cuestionar la propuesta, votar sobre ella y convertirse en el siguiente líder. Incluso un jugador del que todos desconfían puede influir en el resultado, lo que cambia la forma en que el grupo debe gestionar las sospechas.',
        ],
        source: werewolfRules,
      },
      {
        title: 'Qué revela una misión fallida en Avalon',
        paragraphs: [
          'En lugar de quedarte en «Alicia parece del Mal», pregunta qué equipo aprobarías y por qué. En una partida de cinco jugadores, la primera misión necesita dos personas y al menos tres de los cinco deben aprobarla. Solo la pareja seleccionada elige cartas de misión; todos pueden evaluar el resultado.',
          'Una carta de Fallar en una misión del juego básico significa que al menos uno de sus miembros pertenece al Mal. No revela quién la saboteó. Un Éxito no demuestra que ambos miembros sean del Bien, porque el Mal puede elegir Éxito. Sigue comparando los equipos propuestos y los votos de cada persona en lugar de convertir un único resultado en una certeza.',
        ],
      },
      {
        title: 'Merlín no es un Vidente que investiga cada noche',
        paragraphs: [
          'El Vidente de la versión clásica de Hombres Lobo obtiene información mediante acciones nocturnas. Merlín en Avalon recibe información al preparar la partida, con excepciones para roles como Mordred. En Avalon básico no hay una investigación nocturna que se repita. El reto de Merlín es ayudar al Bien sin que lo identifiquen.',
          'Tras tres misiones fallidas, gana el Mal. Tras tres misiones exitosas, el Mal aún tiene un intento de asesinato contra Merlín. Esa es la decisión final de la partida, no una eliminación temprana seguida de más rondas sin la persona elegida como objetivo.',
        ],
      },
      {
        title: 'La comparación con One Night Ultimate Werewolf es distinta',
        paragraphs: [
          'One Night Ultimate Werewolf ya evita la eliminación temprana y no necesita moderador. Abarca una noche y el debate posterior, en lugar del ciclo repetido de día y noche de la versión clásica de Hombres Lobo. Si tu grupo ya juega a One Night, Avalon ofrece una secuencia de votaciones de equipo y resultados de misión; mantener a todos involucrados no es exclusivo de Avalon.',
        ],
        source: oneNight,
      },
      {
        title: 'Cuándo cambiar de Hombres Lobo o Mafia a Avalon',
        paragraphs: [
          'Elige una partida normal de Avalon entre personas si buscas debate continuo, un grupo fijo de 5–10 jugadores y varias oportunidades para poner a prueba los equipos. Las partidas con bots de Avalon también te permiten probar las mismas decisiones de misión solo o con amigos. Elige la versión clásica de Hombres Lobo o Mafia si tu grupo disfruta de los poderes nocturnos, la eliminación de sospechosos y un número de participantes que va cambiando. También existen versiones online de Hombres Lobo, incluida la opción para navegador enlazada aquí.',
          'Para cambiar de juego, enseña primero la votación de equipo y las cartas de misión, y después explica Merlín y el asesinato. Usa las tablas de número de jugadores y roles de nuestras reglas, en lugar de trasladar a Avalon el equilibrio de roles de Mafia.',
        ],
        source: browserWerewolf,
      },
      {
        title: 'Aprende a votar equipos con bots antes de invitar a tu aldea',
        paragraphs: [
          'Prueba Solo o el modo guiado Primera partida para sustituir la conocida votación de eliminación por una votación de equipo de misión. Los bots ocupan la mesa, mientras tú intervienes en el debate y tomas tus propias decisiones de juego. Fíjate en que, aunque no te elijan para una misión, puedes votar y observar su resultado.',
          'Usa esa partida para entender la información inicial de Merlín y la decisión de asesinato, y después comparte lo aprendido con tu grupo de Hombres Lobo o Mafia. También puedes invitar a amigos y dejar que los bots ocupen los asientos libres. Elige el tamaño de mesa, el modo y uno de los idiomas de debate admitidos en la configuración, donde se muestra la disponibilidad actual.',
        ],
      },
      {
        title: 'Cómo probar Avalon online con tu grupo de Hombres Lobo',
        paragraphs: [
          'Si vuestra referencia es una partida presencial con un narrador y un solo móvil para repartir roles, el primer cambio práctico es que aquí cada jugador necesita una cuenta y su dispositivo. Avalon gestiona los roles secretos, los votos y las misiones en el navegador; tú y tus amigos seguís llevando el debate.',
          'Para una partida normal gratuita, reúne a 5–10 personas. Si aún falta parte de la aldea, prueba solo o con amigos y bots antes de fijar la sesión del grupo completo. Revisa en la configuración la disponibilidad, los tamaños que requieren Premium y los idiomas de debate admitidos: inglés, ruso y chino tradicional.',
        ],
      },
    ],
  },
};

export const copy: GuideCopy = {
  tocTitle: 'En este artículo',
  comparisonLabel: 'Comparación de juegos',
  setupLabel: 'Condiciones y comienzo de la partida',
  aiAccessNote: 'Necesitas una cuenta. Los idiomas, los modos y Premium se indican en la configuración.',
  home: 'Inicio',
  breadcrumbLabel: 'Ruta de navegación',
  setupTitle: 'Jugar a Avalon aquí: amigos o bots',
  humanTitle: 'Partidas normales con amigos humanos',
  playersLabel: 'Jugadores',
  humanPlayers: '5–10 personas, cada una en su propio dispositivo.',
  accessLabel: 'Acceso',
  humanAccess: 'Partidas gratuitas en el navegador. Cada jugador necesita una cuenta.',
  discussionLabel: 'Debate',
  humanDiscussion: 'Chat de texto y chat de voz opcional (beta).',
  findingGroupLabel: 'Buscar un grupo',
  findingGroup: 'Organiza una sesión con amigos o utiliza los tablones de jugadores y grupos.',
  boardsNote: 'Los tablones te ayudan a coordinarte; no garantizan encontrar una partida de inmediato.',
  aiTitle: 'Prueba solo o con amigos y bots',
  aiIntro:
    'Juega solo o invita a amigos y deja que los bots ocupen los asientos libres. Elige el tamaño de mesa y el modo en la configuración. ¿Es tu primera vez en Avalon? Prueba el modo guiado Primera partida.',
  aiAvailability:
    'Necesitas una cuenta. Los debates con bots están disponibles en inglés, ruso y chino tradicional. Elige el modo en la configuración; allí se muestra la disponibilidad actual y se indican los tamaños de mesa que requieren Premium.',
  startLabel: 'Empieza a jugar a Avalon',
  aiCta: 'Prueba una partida con bots',
  lobbyCta: 'Abre la sala de espera de Avalon',
  findGroupCta: 'Busca un grupo',
  rulesCta: 'Aprende las reglas',
  sourceLabel: 'Fuente',
  variantTitle: 'Dos reglas que debes comprobar antes de tu primera partida',
  proposalVariant:
    'En el juego de mesa original de Avalon, cinco equipos rechazados seguidos dan la victoria al Mal. Aquí, después de cuatro propuestas rechazadas, el quinto equipo normalmente va a la misión sin votación; las Cartas de trama pueden afectar a la aprobación.',
  assassinationVariant:
    'En el juego original, el Asesino decide a quién identificar como Merlín al final, después de que el Mal lo debata. En las salas normales entre personas de esta plataforma, el equipo del Mal se encarga del asesinato. Las partidas con bots también incluyen un consejo del Mal antes de decidir el asesinato. Los roles opcionales y personalizados pueden cambiar los objetivos disponibles, así que comprueba la configuración de la sala.',
  fullRulesCta: 'Lee las reglas completas y las tablas de número de jugadores',
  previewAlt: 'Tablero de Avalon con ocho asientos de jugadores y resultados de las misiones',
  previewCaption:
    'Un tablero de Avalon con resultados de las misiones, extraído de la vista previa de juego existente en el sitio.',
  nextTitle: 'Empieza con bots o trae a tus amigos',
  nextAi:
    '¿Quieres aprender antes de invitar a un grupo completo? Abre Jugar con IA en la sala de espera, revisa los modos disponibles y elige Solo o el modo guiado Primera partida. Para invitar a amigos, elige Con amigos y comparte el enlace de la sala preparada para que entren antes de empezar.',
  nextHuman:
    'Pide a 5–10 amigos que creen una cuenta, acordad un idioma y cómo vais a hablar, y después abre la sala de espera y crea una sala. Comparte el enlace con tu grupo. ¿Es vuestra primera vez en Avalon? Enseña la votación de equipo y las cartas de misión antes de añadir roles opcionales.',
  arrangeLabel: 'Juega u organiza una partida de Avalon',
  browseGroupsCta: 'Explora los grupos',
  findPlayersCta: 'Busca jugadores',
  merlinCta: 'Comprende a Merlín',
  relatedLabel: 'Más guías de deducción social',
  relatedTitle: 'Sigue comparando',
  ownership:
    'Los nombres de los juegos pertenecen a sus respectivos propietarios. Esta comparación no implica que respalden esta plataforma.',
};
