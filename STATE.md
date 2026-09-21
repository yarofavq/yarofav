# STATE.md - Topology Map (yarofav)

## Модули
- **space.js**: 3D-космос (three.js), animate() - rAF-луп; ранний return при открытом clicker-overlay (GPU-пауза сцены, фикс нагрева телефонов). Грузит clicker.js / clicker_ext.js / clicker_premium.js (?v=91).
- **clicker.js**: ядро кликера. CK / CK_UPG(360) / CK_BOOSTS(14) / CK_ITEMS. CK_BW - веса зелий (godtear 1 ... базовые 10) + взвешенный ролл в ckManualClick. Авто-покупки CK_AUTO {on,min,max,tgt} + модалка ck-auto-modal. Админ-вайп-панель ck-admin-modal (whitelist ckUid). Low-режим: CSS-kill анимаций/теней/фильтров + глобальная пауза невидимых/фоновых видео (setInterval 2.5с, маркер vd.closest ~1561).
- **clicker_ext.js**: EX-слой (spaceClicker_ext_v1): megaCount/superCount/pmSpent персистятся в лоадере (~28). МЕГА x50 / СУПЕР x10000 / АВТО-МЕГА, крафт, ЯДРА, профиль, Supabase-лидерборд. Хвост: ADMIN GRANT IIFE - секция 'ВЫДАЧА РЕСУРСОВ' внутри ck-admin-box (клики, перерождения +2x, иксы, мега +50x, супер +10000x; апгрейды ID 0-359, предметы shard/core/prism/nova/void, бусты id+сек макс 3600; парсер 100K/5M/2B/1T).
- **clicker_premium.js**: магазин ПРЕМИУМ. Валюта avail = EX.megaCount - EX.pmSpent (покупка Rebirth+ стоит 100 мег, pmSpent+100).
- **settings.js / space_extras.js / chat.js / battle.js**: сайт, космос-экстры, чат, арена.

## Инварианты
- mult = 2*rebirths + 50*megaCount + 10000*superCount + 10*GK_RX (ckRecalcMult).
- Премиум-валюта расходует pmSpent, НЕ rebirths - мега-перерождения больше не уменьшают доступность ПРЕМИУМ.
- Wipe-флаг spaceClicker_wiped=16.
- Сейвы: spaceClicker_v1, _ext_v1, _auto, _gen_v1, _uid, _pt.
- Патчи файлов: search-якоря только однострочные (CRLF-файлы, многострочный поиск не матчится).
- Стиль правок: ASCII-якоря; кириллица только в генерируемых текстах UI.
