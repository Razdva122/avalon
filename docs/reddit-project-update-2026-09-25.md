# Новые публикации о развитии Avalon

Статус: черновики, не опубликованы. Дата: 25 сентября 2026. Аккаунт, указанный владельцем: https://www.reddit.com/user/Razdva12/ . Авторизованное подключение ещё не установлено.

## Проверка площадок

- r/boardgames: не размещать эти AI-сгенерированные тексты. Rule 9 прямо запрещает AI-generated posts/comments. Rule 5 также требует 10:1 участия и интервал 10 недель для обновлений конкретной игры; Rule 7 требует письменного разрешения правообладателя для цифровых воссозданий. Источник: https://www.reddit.com/r/boardgames/wiki/contribution-guides/ . Это не решается косметическим перефразированием текста.
- r/digitaltabletop: правила прочитаны через https://www.reddit.com/r/digitaltabletop/about/rules.json . Самопродвижение цифровых настолок разрешено, обычно не чаще двух раз в месяц; повтор одного анонса без новостей запрещён. Подготовленный текст относится к цифровой настольной игре и содержит существенное обновление проекта. Историю недавних публикаций аккаунта ещё нужно проверить в авторизованном браузере; публичный профиль не загрузился через web-инструмент. Старые анонсы 2024 года не доказывают соблюдение текущего месячного лимита.
- Вторая площадка: выбрать после проверки актуальных правил и публичного профиля автора. Не размещать одинаковый текст массово и не выдавать создателя за независимого пользователя.

## Подтверждённые факты

Проект развивается более двух лет — заявление владельца, согласуется с публичными анонсами марта 2024 года. Не утверждаем, что каждая перечисленная функция появилась недавно: это состояние проекта после двух с лишним лет развития.

AI Arena: семь ботов, обсуждения, игровые решения, режим без рейтинга. Пользователи могут смотреть матчи; запуск и управление в текущем коде доступны администраторам (`AiService.canManage`). Не обещать игру человека против ботов, свободный запуск всеми пользователями или доступ всем к приватным объяснениям моделей.

Достижения: отслеживание прогресса, цели по победам/ролям/числу игроков, разблокируемые награды. Статистика: число игр, процент побед, рейтинги по ролям, история рейтинга.

Каталог ролей сайта: Merlin, Merlin Pure, Guinevere, Percival, Tristan, Isolde, Cleric, Troublemaker, Servant, Good Lancelot, Evil Lancelot, Mordred, Morgana, Oberon, Trickster, Witch, Revealer, Lunatic, Brute, Minion. В локальном коде также есть экспериментальный Wraith; на проверенной публичной странице каталога он отсутствует, поэтому не обещаем его в посте.

Дополнения сайта: Lady of the Lake, Excalibur, Plot Cards, Lady of the Sea. Не заявляем полноту по всем официальным изданиям Avalon. Собственные варианты описываем как варианты этого проекта; не объявляем все похожие названия уникальными изобретениями.

Источники: https://avalon-game.com/wiki/roles/ , https://avalon-game.com/wiki/expansions/ ; код Options.vue, aiArena.ts, achievements.ts, pages/stats.ts, backend/src/ai/service.ts.

## Вариант 1 — обновление проекта для сообщества цифровых настолок

**Title:** More than two years of building Avalon online: AI Arena, achievements, stats and custom roles

Hi everyone! I'm one of the creators of [avalon-game.com](https://avalon-game.com/), an unofficial browser version of The Resistance: Avalon. We've been developing the project for more than two years, and I wanted to share how it has grown since our early posts.

You can still gather 5–10 friends and play in a browser. Everyone signs in, one person creates a room, and the others join through its link. Regular games with friends are free; optional premium features are separate.

Here are some of the things you can find on the site now:

- **AI Arena:** watch seven AI bots play Avalon, follow their discussions and see how their votes and quest decisions unfold. These matches are unranked. Match creation is currently managed by the project admins; this is a spectator mode, not a promise that you can join a bot match as a human player.
- **Achievements:** track your progress toward challenges across roles, teams and player counts, and unlock rewards along the way.
- **Player statistics:** see games played, win rates, role-specific ratings and rating history.
- **Roles and variants:** alongside Merlin, Percival, Morgana, Mordred, Oberon, loyal servants and minions, the site includes both Lancelots, Troublemaker, Trickster, Lunatic and Brute. You can also try our additional and experimental variants, including Merlin Pure, Guinevere, Cleric, Witch, Revealer, and Tristan and Isolde—the Lovers. The [role guide](https://avalon-game.com/wiki/roles/) explains how each version works on our platform.
- **Expansions:** Lady of the Lake, Excalibur and Plot Cards, plus the Lady of the Sea variant. You choose the setup for each room; you don't have to enable everything at once.
- **Tools for actual game nights:** game history, room text chat and a Hide spoilers option for people playing around the same table with separate screens. For remote voice discussions, use a separate call such as Discord.

This is a fan project, not an official adaptation or a project affiliated with the original publishers.

If you've used the site before, I'd love to hear what your group plays most: the classic setup, expanded roles or custom variants. And if you watch an AI Arena match, what do you notice about the bots' accusations and voting compared with your human games?

## Вариант 2 — для подходящего сообщества об AI-играх

Не предназначен для r/boardgames. Выбрать площадку, допускающую проекты авторов и AI-generated text, до размещения.

**Title:** Watching seven AI bots play Avalon in our browser game's AI Arena

I'm one of the creators of [avalon-game.com](https://avalon-game.com/), a fan-made browser implementation of The Resistance: Avalon that we've been developing for more than two years.

One of the features we've added is **AI Arena**: seven bots play an unranked game while spectators can follow their discussion, votes and quest decisions. The interesting part is seeing whether their public claims line up with what they actually do as a team.

This is a game feature, not a validated benchmark of model intelligence. Match creation is currently managed by the project admins. Visitors can watch available matches through the **ai-games** filter in the lobby; humans do not take seats in these bot matches.

The rest of the site is built for groups of 5–10 human players. It includes achievements with progress and rewards, win-rate and role-rating statistics, game history, and configurable roles and expansions. Alongside the familiar Avalon roles, there are additional variants such as Merlin Pure, the Lovers, Guinevere, Cleric and Witch. The expansion options include Lady of the Lake, Excalibur, Plot Cards and Lady of the Sea.

Regular games with friends are free, with accounts required to create a room or join as a player; optional premium features are separate. The project is unofficial and isn't affiliated with the original publishers.

For people who enjoy social deduction games: when watching AI players, which mistakes would you look for first—contradictory accusations, weak team selection or voting patterns that reveal too much?

## Перед фактической отправкой

Получить публичный username и доступ через поддерживаемое подключение/браузер, без передачи пароля в чат. Проверить правила выбранных сообществ, историю аккаунта, недавние похожие публикации, доступные flairs и фактическое наличие AI-матчей для просмотра. Пользователь уже поручил публиковать подходящие посты; повторное общее разрешение не нужно. Если правила исключают публикацию, выбрать другую подходящую площадку и зафиксировать причину. После успешной отправки сохранить ссылки и точный опубликованный текст.
