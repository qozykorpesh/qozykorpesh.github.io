# Qozy Korpesh — запуск на Cloudflare (бесплатно)

Состав: `public/` — сайт и админка (`/admin.html`), `functions/api/` — бэкенд, `schema.sql` — база D1.

1. Установите Node.js, затем: `npm i -g wrangler` и `wrangler login`
2. База: `wrangler d1 create qozy-korpesh` — скопируйте `database_id` в `wrangler.toml`
3. Таблицы: `wrangler d1 execute qozy-korpesh --remote --file=schema.sql`
4. Проект: `wrangler pages project create qozy-korpesh --production-branch main`
5. Выкладка: `wrangler pages deploy`
6. Пароль админки: `wrangler pages secret put ADMIN_TOKEN --project-name qozy-korpesh` (введите длинный пароль)
7. Откройте `https://qozy-korpesh.pages.dev` и `https://qozy-korpesh.pages.dev/admin.html`

Работа: клиент регистрирует выбор, получает код QK-1234, платит вам в WhatsApp, вы в админке нажимаете «Активировать». После этого по коду видны имена.
