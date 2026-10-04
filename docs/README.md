# Documentation index

Current setup and operations are documented in the guides below. Commands use the
repository root unless stated otherwise. This refresh was checked against the
repository on **2026-10-04** (package version **69.7.1**). It does not establish
the version currently deployed to production.

Dated reports, experiments, designs and plans are historical records. Their budgets,
model versions, test counts and deployment status must not be treated as current
defaults. NOWPayments is retired; support uses direct BTC/USDT transfers.

## Start here

- [Avalon: The Resistance Online](../README.md)
- [Development guide](development.md)
- [Architecture and data flow](architecture.md)
- [Настройки окружения backend](environment.md)
- [Release and deployment guide](../deploy/README.md)
- [@avalon/backend](../packages/backend/README.md)
- [@avalon/ui](../packages/ui/README.md)
- [@avalon/types](../packages/types/README.md)

## Features

- [AI Arena](ai-rooms.md)
- [Persistent room chat](room-chat.md)
- [Голосовой чат комнаты · beta](voice-chat.md)
- [Community player boards](player-boards.md)
- [Password recovery with Yandex Cloud Postbox](password-recovery.md)
- [Прямые переводы: BTC и USDT](payments/direct-crypto.md)
- [Система достижений Avalon](../packages/backend/src/achievements/README.md)
- [«Лучший из лучших»](best-of-the-best-achievement.md)
- [Plot Cards Addon](../packages/backend/src/core/game/addons/plot-cards/README.md)

## Operations and maintenance

- [Миграции базы данных](database-migrations.ru.md)
- [AI accounting and diagnostic retention](ai-storage-retention.md)
- [Security hardening — 27 September 2026](security-hardening.md)
- [Восстановление пароля: Yandex Cloud и выкладка через Docker Compose](production-password-recovery.ru.md)
- [AI games: production configuration](../deploy/ai-production.md)
- [Codex on the production backend](../deploy/codex-production.md)
- [Mounted nginx configuration compatibility](../deploy/nginx/README.md)
- [Consistent standalone MongoDB backups](../deploy/voice/database-backups.md)

## UI, localization and assets

- [Localization](../packages/ui/src/i18n/README.md)
- [SEO changes and verification](../packages/ui/SEO.md)
- [Material Icons subset](../packages/ui/src/assets/fonts/README.md)
- [Premium: Mind games](../packages/ui/src/assets/images/premium/README.md)
- [Sticker artwork](../packages/ui/src/assets/images/stickers/README.md)
- [Screenshots for the Reddit announcement](announcement-assets/README.md)

## Retired integration

- [NOWPayments — интеграция удалена](payments/nowpayments.md)

## Historical reports and research

- [Локальный эксперимент: боты Avalon через Codex / ChatGPT](ai-evaluations/2026-10-01-codex/README.md)
- [Видимость Avalon в поиске и ответах ИИ](ai-search-2026-09-25.md)
- [Материалы для обзоров Avalon](avalon-outreach-2026-09-25.md)
- [Аудит базы данных Avalon — 27 сентября 2026](database-audit-2026-09-27.md)
- [Исправления аудита базы данных](database-fixes-2026-09-27.md)
- [AI-комната Avalon](history/ai-experiment-2026-09-21-to-2026-10-03.md)
- [LCP: исследование и доработки 29 сентября 2026](lcp-improvements-2026-09-29.md)
- [Аудит объявлений и SEO — 29 сентября 2026](player-boards-audit-seo-2026-09-29.md)
- [Замеры production MongoDB — 27 сентября 2026](production-database-measurements-2026-09-27.md)
- [Восстановление production после миграции](production-database-repair-2026-09-27.md)
- [Новые публикации о развитии Avalon](reddit-project-update-2026-09-25.md)
- [Аудит изображений Avalon — 17 сентября 2026](research/2026-09-17-image-optimization.md)
- [SEO страниц дополнений — 29 сентября 2026](seo-addon-pages-2026-09-29.md)
- [SEO improvements — 28 September 2026](seo-improvements-2026-09-28.md)
- [SEO страниц ролей — 29 сентября 2026](seo-role-pages-2026-09-29.md)
- [UI/UX audit — 2026-09-29](ui-ux-audit-2026-09-29.md)
- [SEO and performance follow-up — 16 September 2026](../packages/ui/PERFORMANCE-2026-09-16.md)

## Design records

- [NOWPayments support and Premium](superpowers/specs/2026-09-16-nowpayments-design.md)
- [Unified image storage](superpowers/specs/2026-09-17-image-storage.md)
- [Прямые криптовалютные переводы для поддержки Avalon](superpowers/specs/2026-09-18-direct-crypto-support-design.md)
- [Восстановление пароля и служебная почта](superpowers/specs/2026-09-18-password-recovery-design.md)
- [Эксперимент: семь AI-игроков в Avalon](superpowers/specs/2026-09-21-ai-avalon-experiment.md)
- [Голосовой чат комнаты · beta](superpowers/specs/2026-09-26-room-voice-design.md)
- [Community player boards](superpowers/specs/2026-09-29-player-boards-design.md)

## Implementation plans

- [NOWPayments Implementation Plan](superpowers/plans/2026-09-16-nowpayments.md)
- [Image Storage Implementation Plan](superpowers/plans/2026-09-17-image-storage.md)
- [Direct Crypto Support Implementation Plan](superpowers/plans/2026-09-18-direct-crypto-support.md)
- [Password Recovery Implementation Plan](superpowers/plans/2026-09-18-password-recovery.md)
- [AI room implementation plan](superpowers/plans/2026-09-21-ai-room.md)
- [Frontend performance implementation](superpowers/plans/2026-09-21-frontend-performance.md)
- [Room chat implementation plan](superpowers/plans/2026-09-21-room-chat.md)
- [AI decision reliability implementation plan](superpowers/plans/2026-09-22-ai-decision-reliability.md)
- [Room voice beta implementation plan](superpowers/plans/2026-09-26-room-voice.md)
- [Database reliability implementation plan](superpowers/plans/2026-09-27-database-reliability.md)
- [Persistent room chat implementation plan](superpowers/plans/2026-09-28-persistent-room-chat.md)
- [Community Player Boards Implementation Plan](superpowers/plans/2026-09-29-player-boards.md)
- [Codex SSH worker implementation](superpowers/plans/2026-10-01-codex-ssh.md)
- [AI dialogue and discussion languages implementation plan](superpowers/plans/2026-10-03-ai-dialogue-languages.md)
- [AI discussion before team selection](superpowers/plans/2026-10-03-ai-discussion-before-team.md)
- [Role image framing implementation plan](superpowers/plans/2026-10-03-role-image-framing.md)

## Keeping documentation current

Update the relevant guide when changing scripts, environment precedence, network
contracts, persisted schemas, feature flags or release behavior. Add new guides to
this index and link them from the feature/package overview. Keep dated evidence
intact and clearly labelled; avoid mixing past rollout status into current setup.
Do not record secrets or invent live verification results.
