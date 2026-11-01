# Design System: Hojas y Trigo (digital menu)
**Project ID:** hojas-y-trigo-menu (local codebase, based on menu-demo)

The source of truth for every value below is `src/index.css` (`@theme` tokens) and the shared components in `src/components/ui.jsx`. Change a token there and the menu and the admin panel follow.

## 1. Visual Theme & Atmosphere

Brunch mexicano with a rustic, warm language taken straight from the café's own printed menu and Instagram: a dark espresso band at the top (navbar + header, joined by a terracotta rule), a cream body, terracotta for anything selected, sage for quiet fills. Headers are heavy, extended, uppercase Archivo, echoing the wide display type of their Canva menu. The leaf + wheat line mark appears as the logo and as a faint watermark in the header. Illustrated tiles in sage, masa, clay and mustard stand in for photos until the café provides real ones.

Details that give it personality, all taken from the café's own material:
- **Scalloped edges** (papel picado / awning) close the espresso header and open the espresso footer (`.scallop-down`, `.scallop-up`).
- **Brand seal** (`BrandSeal.jsx`): the logo inside a ring of wide caps, "Café de especialidad · Brunch mexicano · Apaxco", turning very slowly; desktop only, static under reduced motion.
- **Handwritten accent** (Caveat, `font-script`), like the script lines on the printed menu. Used only for the greeting, "Algo que quizás te guste…" (their phrase), the recommended-card labels and the footer quote.
- **Values strip** under the header with their Instagram promises: cocina con intención, café de especialidad, pan de masa madre, pet friendly.
- **Section ornament** (`SectionOrnament.jsx`): two hairlines with the leaf + wheat mark between sections; each section title has a dashed terracotta icon stamp.
- **Ticket cards:** dashed tear line above the price, price in the display face, "Favorito de la casa" stamp in solid terracotta. Illustration tiles have fine hatching and a dashed-ring disc.
- **Footer band:** espresso, with the quote from their menu ("Déjate sorprender con las maravillas del café", Alicia en el país de las maravillas), hours, Friday evening hours, address and Instagram.
- **Paper grain** over the whole menu (`.paper-grain`, fixed, 5 % opacity).
- Tips and notes start closed: the demo guide is a small dashed pill until opened, and the kitchen note in the cart is a "Agregar una nota" button until tapped.

Light-only on purpose. Copy is Spanish, second person, no emojis, no em-dashes.

## 2. Color Palette & Roles

| Role | Value | Use |
|---|---|---|
| Primary (`--color-primary`) | Espresso #221712 | Navbar and header band, primary buttons, add (+) buttons, product card top rule |
| On Primary | Cream #F5EFE6 | Text on espresso |
| Secondary (`--color-secondary`) | Sage mist #E3E7DC | Secondary buttons, segmented tracks, chips |
| Accent (`--color-accent`) | Terracotta #AD5236 | Active option pills, active section tabs, navbar bottom rule, badges. Darkened from brand #C86D51 so cream text passes AA |
| On Accent | #FBF6EF | Text on terracotta |
| Accent Soft / Ink | #F6E1D6 / #9A4529 | Promo banner, "Obligatorio" chips / terracotta text on light |
| Brand originals | Terracotta #C86D51, Sage #6E856C, Sage light #A9BBA5, Mustard #D9A441 | Decoration and text on espresso only (logo disc, "antoja" highlight, icons in header) |
| Background (`--color-bg`) | Cream #F5EFE6 | Page canvas |
| Surface / Surface 2 | #FBF7F1 / #F1E9DD | Cards, sheets / insets |
| Line / Line Strong | #E6DBCC / #D4C5B2 | Dividers / inactive pill outlines |
| Ink / Muted / Subtle | #2A1D16 / #6A5A4F / #74635A | Text |

Tiles (neutral, slightly desaturated): sage #E1E5DA, masa #ECE4D6, clay #EDDCD0, mustard #EFE4C9, olive #E5E3D3, stone #E8E0D6, line icon #3A2A21.

## 3. Typography Rules

- **Display: Archivo Variable** (self-hosted, weight + width axes). Section titles and the page headline use `.font-wide` (125 % width), extra-bold to black, uppercase. Product names use normal width, bold.
- **Body: Karla Variable** (self-hosted). Everything else.
- **Script: Caveat Variable** (self-hosted). Accent only, never for prices, buttons or anything you must read to order.
- Prices use tabular figures (`.tabular`). Headings are balance-wrapped.

## 4. Component Stylings

- **Buttons:** Pill-shaped, 44 px tall by default (36 px small, 52 px large). Primary is roasted cocoa, secondary is latte foam, outline has a 1 px strong line, danger is red. Press feedback is a 2 % shrink. Disabled is 40 % opacity.
- **Add buttons:** Round 44 px caramel circles with a plus icon. They turn into a check for a moment after a direct add.
- **Cards/Containers:** Gently rounded 16 px corners, 1 px hairline border, linen surface, no shadow at rest; a whisper-soft tinted shadow and a 2 px lift on hover. One stat card can invert to cocoa.
- **Sheets & Dialogs:** 24 px corners. Bottom sheet with a drag handle on phones, centered dialog on tablets and desktop, side drawer for long forms (menu editor, cart on desktop). Backdrop is a 50 % dark-roast scrim with a light blur.
- **Inputs/Forms:** 12 px corners, 44 px minimum height, strong 1 px border, label above the field, helper text below, error text in red below. Focus shows an ink border plus a soft caramel ring.
- **Segmented controls:** Pill track in secondary gray with the active option as a raised linen pill. Used for category switch, filters, ranges and tabs.
- **Badges:** Small pills with soft background and strong text in the matching semantic color.
- **Switches:** 48 by 28 px pill, cocoa when on.

Shape rule: interactive controls are pills, containers 16 px, sheets 24 px, inputs 12 px.

## 5. Layout Principles

- Mobile first. Every tap target is at least 44 px. Content width caps at 1152 px on the menu and 1280 px in the admin.
- Menu on phones: product cards are compact rows (text left, art right) so names and prices read in one glance; from 640 px they become vertical cards in a 2 to 4 column grid.
- Sticky chrome is kept short: a 64 px top bar plus the section tab strip. The category switch lives in the page header on phones.
- The cart is a floating pill that appears only when there is something in it.
- Admin: 256 px sidebar on desktop (collapsible to 80 px), bottom tab bar with a "Más" sheet on phones. The POS is full bleed with the ticket docked on the right from 1024 px.
- Layers: sticky bars 30, floating cart 40, sheets 50, dialogs over sheets 60, toasts 70.
- Motion is short and purposeful (200 to 320 ms): sheets slide up, dialogs pop in, sections fade up once on scroll, the cart bumps when something lands in it. Everything collapses to instant under reduced motion.
