# Hojas y Trigo — Digital Menu Log

Base template: https://github.com/Jetsil2311/menu-demo
Client: Hojas y Trigo (Hojas & Trigo), brunch mexicano y café de especialidad. Saturno 5, Apaxco de Ocampo, Edo. de México. IG @hojasytrigo. Pedidos y domicilio 55 2696 6163.
Status: first demo (2026-10-31). Still running on the local demo store, no client backend yet.
Last updated: 2026-10-31

---

## Brand

All tokens live in `src/index.css` (`@theme`). Light-only. Full roles in `DESIGN.md`. Sources: the café's Canva menu (https://bison-pfjxkq.my.canva.site/) and Instagram.

- Primary color: `--color-primary` → #221712 espresso (navbar, header band, primary buttons, add buttons, card top rule); text on it `--color-on-primary` #f5efe6
- Secondary color: `--color-secondary` → #e3e7dc sage mist; text on it `--color-on-secondary` #34432f
- Accent color: `--color-accent` → #ad5236 terracotta, darkened from the brand #c86d51 so white text passes AA (active option pills, active tabs, badges, navbar bottom rule); text on it `--color-on-accent` #fbf6ef; soft `--color-accent-soft` #f6e1d6; text-safe `--color-accent-ink` #9a4529
- Background color: `--color-bg` → #f5efe6 brand cream; surfaces #fbf7f1 / #f1e9dd
- Brand originals for decoration and text on espresso: `--color-brand-terracotta` #c86d51, `--color-brand-sage` #6e856c, `--color-brand-sage-light` #a9bba5, `--color-brand-mustard` #d9a441
- Text: ink #2a1d16, muted #6a5a4f, subtle #74635a
- Illustration tiles: sage, masa, clay, mustard, olive, blush + tile ink #3a2a21
- Heading font: Archivo Variable (self-hosted, @fontsource-variable/archivo/standard.css with the width axis). `.font-wide` utility sets `font-stretch: 125%` for the extended, heavy uppercase headers that echo the Canva menu. Product names use normal width.
- Body font: Karla Variable (self-hosted, @fontsource-variable/karla)
- Script accent: Caveat Variable (self-hosted, @fontsource-variable/caveat), `font-script`, used in four places only
- Logo: `/logo.svg` = the café's leaf + wheat line mark (cream) on a terracotta disc, same as the Instagram avatar. The mark is embedded as a PNG inside the SVG. Loose marks: `public/brand/hojas-mark-cream.png`, `public/brand/hojas-mark-espresso.png` (transparent, 256 px).
- Business identity + visit info: `src/config/demo.js` (`BUSINESS_NAME`, `BUSINESS_TAGLINE`, `BUSINESS_HOURS`, `BUSINESS_EVENING`, `BUSINESS_ADDRESS`, `BUSINESS_PHONE`, `BUSINESS_INSTAGRAM`, `DEMO_PIN`)
- Vibe: rustic. Espresso band on top (like the printed menu), cream body, terracotta for "selected", sage for quiet fills. Spanish copy, second person, no emojis, no em-dashes.

---

## Routing

Customer-facing routes:
- `/` — redirects to `/menu` (the freelance landing page was removed on 2026-10-31)
- `/menu` — full menu (all sections)
- `/menu/bebidas` — only sections with category "Bebidas"
- `/menu/alimentos` — only sections with category "Alimentos"
- any unknown path — redirects to `/menu`

Admin routes (all under `/admin`, no login; every screen starts unlocked and can be PIN-locked from the top bar, demo PIN 1234):
- `/admin` (index) — Resumen
- `/admin/pos` — Punto de venta
- `/admin/pedidos` — Pedidos (kitchen board)
- `/admin/caja` — Caja
- `/admin/menu` — Editor de menú (Productos, Extras, Recomendados)
- `/admin/clientes` — Clientes
- `/admin/promociones` — Promociones
- `/admin/metricas` — Métricas
- The legacy `/admin/legacy` screen was removed.

Admin views are lazy-loaded (code split) so the public menu bundle stays small.

---

## Menu Structure

Data source: local demo store (`src/demo/store.js`), seeded from `src/demo/seed.js` (`SEED_VERSION` 6). Prices in MXN, copied from the café's Canva menu. Option groups use `{ id, name, type: 'single'|'multi', required, options: [{ id, name, priceModifier }] }`.

Extras (toppings): Huevo $15, Pechuga asada $35, Milanesa $45, Arrachera de res $50 (salty dishes), Helado de vainilla Häagen-Dazs $25 (pan francés).

### Café y Bebidas Calientes (Bebidas)
Description: Para empezar la mañana sin prisa. Espresso de especialidad, cacao de verdad y especias de temporada.
- Americano — $55 — Carga (single, req): Sencillo, Doble carga +$15
- Capuchino Natural — $75
- Latte Natural — $85
- Capuchino de Sabor — $85 — Sabor (single, req): Chocomenta, Chocolate, Mazapán, Tiramisú, Caramelo, Vainilla, Avellana, Mocha, Mocha blanco
- Capuchino Pistache — $85
- Pumpkin Spice Latte (favorito) — $95
- Cacao Xibalbá 70 % — $85
- Tisana — $75
- Matcha — $85
- Dirty Chai — $85

### Bebidas Frías (Bebidas)
Description: Para cuando el mediodía ya calienta. Matchas, malteadas, sodas con esferas y un carajillo para la sobremesa.
- Matcha Frío — $85 — Sabor: Matcha, Strawberry, Horchata
- Matcha Coco — $95
- Horchata Latte (favorito) — $85
- Hawái — $85
- Bacalar — $90
- Panchito Pantera — $90
- Malteada — $95 — Sabor: Chocolate, Mazapán, Fresa, Taro, Oreo
- Soda Italiana con Esferas — $75 — Sabor: Blueberry, Maracuyá, Fresa, Kiwi, Manzana verde
- Smoothie — $85 — Sabor: Piña colada, Taro, Fresa, Mango, Maracuyá, Dragonfruit
- Espresso Tónic — $95
- Carajillo — $125
- Refresco o Agua Mineral — $45 — Bebida: Coca-Cola, Boing, Agua mineral

### Jugos Naturales (Bebidas)
Description: Verdes o frutales, recién hechos. El arranque ligero antes del brunch.
- Aloha — $65 · Hula — $65 · Nani — $65

### Fruta y Açaí (Alimentos)
Description: Lo fresco primero. Fruta de temporada y açaí cremoso para abrir el apetito.
- Açaí Bowl (favorito) — $125 — Base: Frutos rojos, Cacao y banana
- Bowl de Fruta Picada — $65

### Del Sazón de la Casa (Alimentos)
Description: Los desayunos de siempre, con el sazón de la casa. Huevos al gusto y molletes bien servidos.
- Huevos a la Mexicana — $125
- Omelette de la Casa — $125
- Huevos Divorciados — $145 — Salsas: Verde y roja, Verde y mole, Roja y mole; Tortilla: Frita, Blanda
- Molletes de la Casa — $125 — Guiso: Longaniza, Milanesa, Cochinita, Jamón. Extras salados
- Molletes Guajolotes — $155 — Chilaquiles: Rojos, Verdes. Extras salados

### Chilaquiles y Enchiladas (Alimentos)
Description: El corazón del brunch mexicano. Los chilaquiles llegan con pan y frijoles.
- Chilaquiles (favorito) — $115 — Salsa: Verdes, Rojos, Mole +$10, Encacahuatados +$10, Morita +$10. Extras salados
- Enchiladas — $115 — Salsa: Suizas, Rojas. Extras salados
- Enmoladas Veracruzanas (favorito) — $125. Extras salados
- Enfrijoladas — $115. Extras salados

### Panadería y Dulce (Alimentos)
Description: Para la mesa que pide algo dulce. Pregunta también por el pan dulce artesanal del día.
- Pan Francés de la Casa (favorito) — $125 — Extra: Helado
- Pan Francés Pistache — $150 — Extra: Helado
- Club Waffles — $105
- Hot Cakes de la Casa — $115 — Cobertura: Betún de la casa, Crema de avellanas, Lechera

### Chapatas y Rollos (Alimentos)
Description: Pan artesanal de masa madre, bien relleno. Para cuando el antojo ya es hambre.
- Chapata de la Casa (favorito) $125 · Arrachera $150 · Milaqueso $135 · Tocino $125 · Vegetariana $120 · Cheesesteak $170 · Jamón Serrano $150 · Rollo Agridulce $115 · Rollo de Arrachera $145

### Hamburguesas y Hot Dogs (Alimentos)
Description: El antojo de fin de semana. Sirloin, tocino y quesos sin medirse.
- Hamburguesa de la Casa $150 · Especial $175 · Hawaiana $125 · Hot Dog Artesanal $115 · Hot Dog de Arrachera $150
- Alitas o Boneless — $115 — Corte: Alitas, Boneless; Salsa: Picosas, Agridulce
- Club Sándwich de Jamón — $95
- Maxi Gringa — $135 — Relleno: Cochinita, Arrachera +$15

### Ensaladas y Bowls (Alimentos)
Description: Ligeras, pero con carácter. Quesos, nueces y frutos rojos sobre hojas frescas.
- Ensalada Verano $115 · Campestre $155 · Clásica $115 · Bowl de la Casa $145 (Proteína: Pollo, Atún). Extras: Pechuga +$35, Arrachera +$50

Recomendados (carousel): Pumpkin Spice Latte ("De temporada"), Chilaquiles ("El clásico del brunch"), Pan Francés Pistache ("Para el antojo dulce").
Promotions: "Viernes de cafetería por la noche" 18:30 a 21:30 (active), "Servicio a domicilio" 55 2696 6163 (inactive). Both are real info from the menu, no invented discounts.

---

## Key Systems

### Demo data store (replaces Firebase)
- `src/demo/store.js` exposes the same function names as the Firestore client SDK (collection, doc, query, where, orderBy, limit, getDocs, getDoc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction, serverTimestamp, increment, arrayUnion, arrayRemove, Timestamp). All screens import from it.
- Data persists in `localStorage` key `menu-demo-db` with a 300 ms debounced save; nothing leaves the browser. Other tabs stay in sync through the `storage` event (an order sent from `/menu` appears live in `/admin/pedidos`).
- Seed: 5 sections, 22 products, 8 extras, 3 recommended, 2 promotions, 14 invented customers (phones in the fictional 555-01xx range), ~30 days of order history and 15 days of register sessions. Generated deterministically relative to the first visit.
- When the demo is opened on a later day, every stored date shifts forward by the same number of days, so "today" always has activity.
- `SEED_VERSION` in `seed.js`: bump it whenever the seed shape changes; older browser copies reload automatically.
- "Reiniciar demo" (sidebar footer, or Más on phones) restores the sample data.
- Image uploads (`src/utils/uploadImage.js`) are compressed to data URLs in the browser. No Cloudinary.
- To reconnect a real backend for a client: point the imports from `../demo/store` back to `firebase/firestore` plus a configured `db`.

### Option Groups / BottomSheet
- Products with option groups open the BottomSheet (bottom sheet on phones, centered dialog on desktop). Required groups block the add button and the button says what is missing.
- Products without option groups add directly to the cart (toast + fly-to-cart).
- Extras (toppings) show in a second step ("¿Le ponemos algo extra?") after options, or directly for products that only have extras.
- Menu cards, recommended cards and the POS all go through the same add flow.

### Cart and ordering
- In-memory cart. Price = base + options + extras, per unit, times quantity (fixed: the cart previously ignored option prices in the per-item line).
- "Enviar pedido" saves the order to the store with status "Nuevo" and `source: 'menu'`, then shows a confirmation with the order number. If a WhatsApp number is set in Ajustes, the customer can also send a copy by WhatsApp.

### Admin
- No authentication. Optional per-screen PIN locks (lock icon in the top bar), demo PIN shown as a hint while it is still the default.
- Ajustes (gear icon): WhatsApp number, PIN change, printer settings. The authorized-emails list was removed with the login.
- Pedidos: board with Nuevo / Preparando / Listo columns (oldest first) plus filters per state and search.
- Loyalty: cashback, 10 % of each paid POS order; balance redeemable at the POS.
- Register cash sales record net cash kept (received minus change).

---

## Collections (demo store)

- `sections` — name, desc, category, order, visible
- `products` — name, section, price, desc, long_desc, imageUrl, icon, optionGroups[], toppingIds[], isActive, popular, order
- `toppings` — name, price, description, isActive
- `orders` — orderId, items[], content, total, status, source ('menu' | 'pos'), paymentMethods, customerId/customerName, generalNote, loyaltyEarned/Redeemed, createdAt, updatedAt
- `parked_orders` — POS apartados
- `customers` — name, phone, loyaltyBalance, visitCount, lastVisit, createdAt
- `register_sessions` — one doc per day (`YYYY-MM-DD`)
- `carousel` — linkedId, altText, order, active, imageUrl (optional)
- `promotions` — title, message, isActive, createdAt
- `settings/general` — orderNotificationPhone, adminPin, pinGateConfig, loyaltyConfig, printer settings

---

## Changes from Base Template

### 2026-07-11 — Removed hardcoded personal emails and phone numbers left in the base template
What changed: A prior editing session on this checkout had left real, personal Gmail addresses hardcoded as admin allowlists (`src/hooks/useAdminAuth.js`, `src/hooks/useAdminData.js`, `src/views/Admin.jsx`) and a real WhatsApp number hardcoded in `src/views/Home.jsx`. Replaced all of these with generic placeholders (`owner@example.com`, a placeholder MX-format phone number) with a comment noting they should be set per client during onboarding. Also replaced the "Mi Querido Tequix"-specific brand comment and coral hex values in `src/index.css` and the matching hardcoded `fill="#eb6b5a"` in both logo SVGs (`public/logo.svg`, `src/assets/logo.svg`) with a neutral blue placeholder palette, since this checkout is meant to serve as the generic base template, not a specific client's project.
Files affected: src/hooks/useAdminAuth.js, src/hooks/useAdminData.js, src/views/Admin.jsx, src/views/Home.jsx, src/index.css, public/logo.svg, src/assets/logo.svg
Reason: This checkout had accumulated client-specific work-in-progress (coral "Mi Querido Tequix" branding, real personal emails/phone) that doesn't belong in a template meant to be reused across clients.

### 2026-07-11 — CORRECTION: reverted the "genericization" of emails/phone/branding above — they were real, live values
What changed: The entry above wrongly assumed `jethrosiloe26@gmail.com` (plus `anqnmes@gmail.com`, `jzamnacc@gmail.com`), the WhatsApp number `7207487599`, and the coral `#eb6b5a` brand palette were leftover client-specific secrets and replaced them with placeholders. This broke login: the Firebase Auth allowlist in `useAdminAuth.js`/`useAdminData.js`/`Admin.jsx` no longer matched `jethrosiloe26@gmail.com`, which is still the live `settings/general.authorizedEmails` entry in this project's actual Firestore (`digital-menu-demo`) — confirmed by the client after they got locked out of their own admin panel. All three files' `ALLOWED_EMAILS` arrays, `src/views/Home.jsx`'s `WHATSAPP_NUMBER`, `src/index.css`'s `--color-brand`/`--color-brand-dark`, and both logo SVGs' `fill` were reverted back to their original values. Project renamed back to "Mi Querido Tequix" in this log's header/Brand section to match.
Files affected: src/hooks/useAdminAuth.js, src/hooks/useAdminData.js, src/views/Admin.jsx, src/views/Home.jsx, src/index.css, public/logo.svg, src/assets/logo.svg
Reason: Bug — this checkout is not actually a blank base template; it's the client's own working project (`digital-menu-demo` Firebase project, "Mi Querido Tequix" branding) that happens to still be mid-rebrand. Don't assume hardcoded emails/phone numbers/colors are leaked secrets without confirming against the live Firestore data or asking first — verify, don't guess.

### 2026-07-11 — Admin menu editor: new products/sections now appear without a manual refresh
What changed: `handleAddProduct` and `handleAddSection` in `useAdminData.js` now append the newly created document to local state (`menuItems` / `menuSections`) immediately after the Firestore write, instead of only clearing the form. `menuSections` stays sorted by `order` after the insert.
Files affected: src/hooks/useAdminData.js
Reason: Ported from Nativa — 2026-05-04. Adding a product or section required a manual page reload to see the change, which felt broken.

### 2026-07-11 — Fixed register cash sales recording gross instead of net cash
What changed: `cashSales` in the register session was incremented by the full cash received (e.g., $500) instead of the net cash that stays in the register after returning change (e.g., $500 − $150 change = $350). Fix: `increment(cashAmount)` → `increment(cashAmount - change)`.
Files affected: src/views/admin/POS.jsx (`handlePayment`, `register_sessions` updateDoc)
Reason: Ported from Nativa — 2026-05-06. If a customer pays with a $500 bill for a $350 order, the register was logging $500 instead of $350, inflating the daily cash total by the change amount.

### 2026-07-11 — Dual-path thermal receipt printing (USB + Windows), logo, IVA breakdown, NaN-safe formatting
What changed: Replaced the old single-path print-server (WiFi/HTTP, `fetch()`-based) implementation with a full dual-path architecture under `src/utils/printing/`: (1) `receiptContent.js` — normalizes a Firestore order into a print-ready shape (`buildReceiptContent`, `buildCommandaContent`), computes the Mexican IVA (16%) breakdown from the stored total with corrected rounding so subtotal + IVA always sum exactly, and exports a NaN-safe `fmt()` money formatter used everywhere prices are rendered. (2) `usbPrinter.js` — WebUSB path, no OS driver required. Connects via `navigator.usb.requestDevice()` filtered to common thermal-printer vendor IDs, auto-reconnects to a previously-paired device via `navigator.usb.getDevices()`, builds a minimal inline ESC/POS byte stream (Latin-1 encoding to preserve á é í ó ú ñ), and rasterizes `/logo.svg` to a 1-bit ESC/POS image (`GS v 0`) printed above the business name — cached after first load, falls back to text-only silently if rasterization fails. 8-second timeouts throughout. (3) `windowsPrinter.js` — browser print-dialog path, works with any OS/printer. Renders the receipt as HTML (with `<img class="logo" src="/logo.svg">`) in a hidden iframe sized for 80mm thermal paper (`@page { size: 80mm auto }`) and calls `contentWindow.print()`; iframe is always cleaned up. (4) `printReceipt.js` (router) — reads `settings.printMethod` (`'usb' | 'windows'`) and delegates; returns `{ success: false, reason: 'disabled' }` when `settings.printingEnabled` is false; comandas always use the Windows path. (5) Top-level `src/utils/printReceipt.js` replaced with a 2-line re-export shim so POS.jsx/Orders.jsx imports didn't need to change. (6) `PrinterChip` in `SettingsChips.jsx` redesigned: master `printingEnabled` toggle, USB/Windows method pills, USB connect/disconnect + live pairing status, shared "Imprimir prueba" test button, business name, footer message, auto-print toggle. (7) POS.jsx / Orders.jsx call sites updated from checking `settings.printServerUrl` to `settings.printingEnabled`; POS's print-failure toast now ignores the `'disabled'` reason (expected state, not a failure).
Files affected: src/utils/printing/receiptContent.js (new), src/utils/printing/usbPrinter.js (new), src/utils/printing/windowsPrinter.js (new), src/utils/printing/printReceipt.js (new), src/utils/printReceipt.js (replaced with re-export shim), src/components/admin/SettingsChips.jsx (PrinterChip), src/views/admin/POS.jsx (print condition + toast), src/views/admin/Orders.jsx (reprint button condition)
Reason: Ported from Nativa — 2026-05-06 through 2026-05-09 (thermal printing system → dual-path architecture → logo on receipts → IVA breakdown → NaN-safe formatting). The old `print-server/` Node/Express directory is left in place but is no longer used by this code path — kept only as reference/fallback.

---

### 2026-10-25 — Turned the repo into a shareable demo: no database, no login, neutral redesign
What changed:
1. **Disconnected the live database.** The app no longer talks to the `digital-menu-demo` Firebase project. `src/firebase.js` (client config), `.firebaserc`, `firebase.json`, `firestore.rules`, `storage.rules`, the `firebase` and `firebase-admin` packages and the Firestore import scripts (`scripts/`, `importCustomers.js`) were removed from the repo. Nothing was deleted or changed in the Firebase project itself. A new in-browser store (`src/demo/store.js`) mimics the Firestore API and is seeded with invented sample data (`src/demo/seed.js`).
2. **Removed real customer data from the working tree.** `customers-2026-04-18.csv` contained real customer names and phone numbers; it was deleted. It is still present in git history (see Known Issues).
3. **Removed the login.** Firebase Auth (email/password + Google), the authorized-emails gate and `useAdminAuth.js` are gone; `/admin` opens directly. PIN locks remain as an optional feature, all screens unlocked by default, demo PIN 1234. The legacy admin (`src/views/Admin.jsx`, `/admin/legacy`) was removed.
4. **Routes.** The menu moved from `/` to `/menu` (`/menu/bebidas`, `/menu/alimentos`); `/` redirects to `/menu` until a landing page exists.
5. **Brand-neutral redesign.** New token system (charcoal ink, zinc neutrals, mango accent, semantic states, illustration tiles) with automatic dark mode; Bricolage Grotesque + Figtree self-hosted; Font Awesome kit removed in favor of Lucide icons. Client assets (product photos with the client's logo, client logos, banner, Boba/Croissant SVGs) were removed; products without photos show illustrated tiles. Every screen of the menu and admin was rebuilt on shared components (`src/components/ui.jsx`, `src/components/admin/AdminUI.jsx`).
6. **Customer menu UX.** Sticky top bar + section tabs with scroll-spy, compact product rows on phones, "Recomendados de la casa" strip instead of the auto-opening fullscreen popup, inline promotion banner, cart as a drawer with a real "Enviar pedido" flow and confirmation (orders appear live in the admin), clearer option sheet that tells you which required choice is missing.
7. **Admin UX.** Grouped sidebar + mobile tab bar, top bar with register status, live new-orders bell and a single Ajustes sheet; Resumen with day stats and today's register; kitchen board for orders; POS with quick cash buttons, card remainder, confirmation dialogs instead of `window.confirm`/`alert`; Caja with entries/withdrawals and a guided cash count; menu editor with side drawer, live card preview, icon picker for illustrations, always-visible actions on touch screens; customers with tiers; metrics with a cleaner chart and top products.
8. **Bugs fixed along the way:** cart line prices ignored option surcharges; Métricas "top products" never matched any order (regex expected `2 x` at line start but lines start with `1.`); `useRegister` did not expose `loading`, so POS/Caja/top bar never showed their loading state; menu editor actions were hover-only and unusable on touch screens; the customer menu purged the order history down to 50 orders on every checkout (removed).
9. Added `DESIGN.md` (design system written in the design-md format).
Files affected: index.html, package.json, package-lock.json, DESIGN.md, digitalMenu.md, public/logo.svg, src/main.jsx, src/index.css, src/config/demo.js (new), src/config/adminPin.js, src/demo/store.js (new), src/demo/seed.js (new), src/utils/uploadImage.js (new), src/utils/cart.js, src/utils/printing/receiptContent.js, src/utils/printing/usbPrinter.js, src/context/RegisterContext.jsx, src/hooks/useSections.js, src/hooks/usePromotion.js, src/hooks/useSettings.js, src/hooks/useAdminDashboard.js, src/hooks/useAdminData.js, src/hooks/useRegister.js, src/components/ui.jsx (new), src/components/ProductArt.jsx (new), src/components/Navbar.jsx, src/components/CategoryTabs.jsx, src/components/SectionsList.jsx, src/components/MenuSection.jsx, src/components/SectionBanner.jsx, src/components/MenuCard.jsx, src/components/BottomSheet.jsx, src/components/ToppingsOverlay.jsx, src/components/CartOverlay.jsx, src/components/CartButton.jsx, src/components/PromoCarousel.jsx, src/components/PromoBanner.jsx, src/components/MoneyInput.jsx, src/components/admin/* (Sidebar, Topbar, BottomTabBar, PinGate, SettingsChips, MobileSettingsSheet, RegisterOverlay, AdminUI new, navItems new), src/views/Home.jsx, src/views/admin/* (AdminLayout, Overview, Orders, POS, Register, Customers, Promos, Metrics, MenuEditor). Deleted: src/firebase.js, src/views/Admin.jsx, src/hooks/useAdminAuth.js, src/utils/cloudinary.js, src/assets/*, public/products/*, public/bklogo.svg, public/vite.svg, .firebaserc, firebase.json, firestore.rules, storage.rules, scripts/, importCustomers.js, customers-2026-04-18.csv.
Reason: The owner wants a demo that can be sent to anyone: no real data, no login, no client branding, and a polished, consistent UI. The landing page will live at `/` later.

### 2026-10-25 — Landing page at `/`
What changed: Added a Spanish landing page that presents the owner's freelance web development work to business owners with little technical background, and sends them to the demo. Sections: hero with real screenshots of the demo, services bento (menú digital, punto de venta, página web, citas, tienda en línea, sistemas a la medida), "Pruébalo tú mismo" with buttons to `/menu` and `/admin` plus a three-step guide, business types (restaurantes, tiendas, salones, consultorios, talleres, gimnasios y escuelas, hospedaje, profesionistas), how we work, FAQ, and a final WhatsApp call to action. Uses the same design tokens and dark mode as the demo. Placeholder name "Brote Digital" and placeholder WhatsApp/email live in `src/config/site.js`. Screenshots of the demo are stored in `public/landing/` (WebP). Page titles are now set per area (landing, menu, panel), the menu footer links back to the landing, and `index.html` carries Open Graph tags for link previews.
Files affected: src/views/Landing.jsx (new), src/config/site.js (new), public/landing/*.webp (new), src/main.jsx, src/views/Home.jsx, src/views/admin/AdminLayout.jsx, src/components/ui.jsx (new `on-accent` button variant), index.html, README.md, digitalMenu.md
Reason: The owner needs one link to send to prospective clients that explains, in plain language, what they can build for any kind of business and lets them try the demo.

### 2026-10-30 — Warm neutral redesign and a demo walkthrough
What changed: The demo looked too dark and too high-contrast (it followed the device's dark mode, with a near-black background, and used pure-black ink on white in light mode). Replaced the whole palette with warm café neutrals: oat background, linen cards, soft espresso text, roasted-cocoa primary buttons and a caramel accent, with muted status colors. Dark mode was removed so every client sees the same look. The heading font changed from Bricolage Grotesque to Fraunces, a soft modern serif. The logo was recolored to match. On the landing page, the dark "Así trabajamos" band is now a soft latte band. Added a short, collapsible guide at the top of `/menu` ("Cómo probar esta demo": elige, personaliza, envía, míralo llegar al panel) and of `/admin` ("Recorrido de la demo": haz un pedido, atiéndelo, cobra en caja, cambia tu menú), each step linking to the right screen. Whether a guide is collapsed is remembered per browser.
Files affected: src/index.css, index.html, public/logo.svg, package.json, package-lock.json, src/components/DemoGuide.jsx (new), src/views/Home.jsx, src/views/admin/Overview.jsx, src/views/Landing.jsx, src/components/PromoCarousel.jsx, DESIGN.md, digitalMenu.md
Reason: The owner sends this demo to prospective clients and wants it pleasant to look at and easy to understand without explanation.

### 2026-10-30 — Landing renamed to "Jethro C." with a "J" mark
What changed: The landing page name changed from the placeholder "Brote Digital" to "Jethro C." (`SITE_NAME`), including the browser tab title, link-preview title and README. The sprout icon next to the name was replaced by a capital "J" in the heading font on the caramel square.
Files affected: src/config/site.js, src/views/Landing.jsx, index.html, README.md, digitalMenu.md
Reason: The owner presents the services under their own name.

### 2026-10-30 — Real contact details on the landing page
What changed: Replaced the placeholder WhatsApp number and email on the landing page with the owner's real ones (WhatsApp 527207487599, jethrosiloe26@gmail.com). Every "Escríbeme por WhatsApp" button and the email link now reach the owner.
Files affected: src/config/site.js, digitalMenu.md
Reason: The landing page is ready to be sent to prospective clients.

---

### 2026-10-31 — Onboarded Hojas y Trigo (first demo)
What changed: Cloned the base template into `hojas-y-trigo-menu` and rebranded it for Hojas y Trigo. New palette from their Canva menu and Instagram (espresso, terracotta, cream, sage), new fonts (Archivo with a wide cut for headers + Karla body, replacing Fraunces + Figtree), their leaf + wheat logo on a terracotta disc, and their full real menu (10 sections, 61 products, real prices). The menu header is now an espresso band joined to an espresso navbar with a terracotta rule, and it shows hours, address and the delivery phone. Selected option pills and section tabs are terracotta; add buttons are espresso; product cards have an espresso top rule. Added food icons (burger, beef, drumstick, fried egg, ice cream, cherry, martini, ham, soup) for the illustrated tiles. Seed bumped to v6 so old browser copies reload.
Files affected: src/index.css, index.html, public/logo.svg, public/brand/*, src/config/demo.js, src/demo/seed.js, src/views/Home.jsx, src/components/Navbar.jsx, src/components/CategoryTabs.jsx, src/components/BottomSheet.jsx, src/components/MenuCard.jsx, src/components/SectionBanner.jsx, src/components/ProductArt.jsx, package.json, DESIGN.md, digitalMenu.md
Reason: New client onboarding.

---

### 2026-10-31 — Removed the freelance landing page; `/` redirects to `/menu`
What changed: Deleted the "Jethro C." landing page, its config and its screenshots. The root route now redirects to the menu. The menu footer no longer credits or links to the landing. `index.html` title, description and link-preview tags now describe Hojas y Trigo.
Files affected: src/main.jsx, src/views/Home.jsx, index.html, src/views/Landing.jsx (deleted), src/config/site.js (deleted), public/landing/*.webp (deleted), digitalMenu.md
Reason: This checkout is the client's menu, not the sales site.

---

### 2026-10-31 — Brand personality pass on the menu; tips and notes closed by default
What changed: Gave the menu its own character using the café's material. Scalloped espresso header and footer; a slowly turning brand seal next to the headline (desktop); handwritten accents (Caveat) for the greeting, "Algo que quizás te guste…", recommended labels and the footer quote; a values strip from their Instagram bio; leaf + wheat ornaments between sections and dashed icon stamps on section titles; ticket-style product cards (dashed tear line, display-face price, "Favorito de la casa" stamp); hatched, stamp-like illustration tiles in more neutral tones; recommended cards in espresso, sage and cream; promo banner as a dashed ticket with a moon icon; espresso footer with the "Déjate sorprender con las maravillas del café" quote, hours, Friday evening hours, address and Instagram; fixed paper grain overlay. The demo guide now starts closed on the menu and in the admin (new storage key `demo_guide_<id>_closed`), and the kitchen note in the cart is folded behind "Agregar una nota para la cocina". Sections now carry an `icon` in the seed (SEED_VERSION 7).
Files affected: src/index.css, package.json, package-lock.json, src/views/Home.jsx, src/components/BrandSeal.jsx (new), src/components/SectionOrnament.jsx (new), src/components/SectionsList.jsx, src/components/MenuSection.jsx, src/components/SectionBanner.jsx, src/components/ProductArt.jsx, src/components/MenuCard.jsx, src/components/ui.jsx (badge tone `stamp`), src/components/PromoCarousel.jsx, src/components/PromoBanner.jsx, src/components/DemoGuide.jsx, src/components/CartOverlay.jsx, src/demo/seed.js, DESIGN.md, digitalMenu.md
Reason: Owner feedback: the first demo looked generic. Tips and notes should not take space until asked for.

---

## Known Issues / Follow-ups

- **Real customer PII is still in git history.** `customers-2026-04-18.csv` (names, phone numbers, balances) was deleted from the working tree but remains in earlier commits on GitHub. If the repo will ever be public or shared, rewrite history (for example with `git filter-repo --path customers-2026-04-18.csv --invert-paths`) and force-push, or keep the repo private. The old Firebase web config (API key for `digital-menu-demo`) is also in history; web API keys are not secret by design, but the project's security rules are what protect that data.
- The live Firebase project `digital-menu-demo` was left untouched (data, rules, auth users). It is simply no longer used by this code.
- Demo data lives per browser in localStorage; each visitor sees their own copy. "Reiniciar demo" restores it.
- Product photos: the demo uses illustrated tiles. Photos uploaded from the editor are stored as compressed data URLs in localStorage (keep them few and small; the browser quota is about 5 MB).
- Printer output (USB ESC/POS and system dialog) is still untested on real hardware; printing is off by default in the demo.
- The legacy `print-server/` folder is unused and kept only as reference.
- The thermal receipt templates (`src/utils/printing/*`) keep literal black/white colors on purpose: they style paper output, not the UI.
- The 2026-10-30 redesign was checked visually on desktop only; the browser window could not be resized to phone width during that session. Layout code was unchanged apart from colors, but give `/menu` and `/admin` a quick look on a phone.
- **Hojas y Trigo, confirm with the owner:** (1) opening days: the Canva menu says martes a domingo 8:15 a 15:00, Instagram says "Mart a Sab"; (2) "Cacao Xilbaba 70 %" was written as Xibalbá (likely typo on their menu); (3) Ensalada Clásica lists both $115 and "queso panela $110"; used $115; (4) Panchito Pantera and Tisana have no description on their menu; generic copy used; (5) milk alternatives and their prices are not on the menu, so no milk option was added; (6) "Degustación de cerveza artesanal (consulta disponibilidad)" is mentioned only in the Refresco info text.
- Hojas y Trigo needs real food photos (they post plenty on Instagram). Until then products use illustrated tiles. The Canva site's coffee photos look like Canva stock, so they were not reused.
- Demo customers/orders in the seed are still invented (generic names), fine for a demo.

