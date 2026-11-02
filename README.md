# Hojas y Trigo · Menú digital

Digital menu for Hojas y Trigo (brunch mexicano y café de especialidad, Apaxco de Ocampo) with its admin panel (point of sale, orders, register, menu editor, customers, promotions and metrics). Everything runs in the browser for now: the menu is the café's real menu, orders and customers are invented sample data, no database, no login.

## Run it

```bash
npm install
npm run dev
```

- `/` redirects to `/menu`.
- `/menu` is the customer menu.
- `/admin` is the admin panel. No login. Screens can be PIN-locked from the top bar; the demo PIN is `1234`.

Open the menu and the admin in two tabs: an order sent from the menu shows up live in **Pedidos**.

## Deploy on Vercel

The repo is ready for Vercel (Hobby plan is enough):

1. In Vercel, **Add New → Project**, import `Jetsil2311/hojasytrigo` and keep the defaults. `vercel.json` already sets the framework (Vite), `npm ci`, `npm run build` and the `dist` output.
2. No environment variables are needed: the menu and the admin run entirely in the browser.
3. Every push to `main` deploys to production; other branches get preview URLs.

`vercel.json` also sends every app route (`/menu`, `/menu/bebidas`, `/admin/...`) to `index.html`, caches the hashed files in `/assets` for a year and adds basic security headers.

Once the domain is known, add an `og:image` with an absolute URL in `index.html` so WhatsApp shows a preview image.

## How the demo data works

- `src/demo/store.js` is a small in-browser store with the same API as the Firestore client (`collection`, `doc`, `onSnapshot`, `addDoc`, …). Data is saved in `localStorage`, so each visitor gets their own copy.
- `src/demo/seed.js` holds the sample menu, customers and a month of orders. Dates move forward automatically so "today" always has activity.
- **Reiniciar demo** in the admin (sidebar footer, or *Más* on phones) restores the sample data.

## Customize

- Business name, tagline, hours, address, phone and demo PIN: `src/config/demo.js`
- Colors, fonts and shadows: tokens in `src/index.css`
- Design rules: `DESIGN.md`
- Project log and menu contents: `digitalMenu.md`
