# Nativa Print Server

A lightweight ESC/POS TCP print server for the Nativa café menu system. Receives JSON print jobs from the React app and sends them to a thermal printer over the local network.

## Setup

```bash
cd print-server
npm install
cp .env.example .env
# Edit .env and set your printer's IP address
node printServer.js
```

The server listens on port `3001` by default.

## Environment variables

| Variable       | Default         | Description                        |
|----------------|-----------------|------------------------------------|
| `PRINTER_IP`   | 192.168.1.100   | IP address of the thermal printer  |
| `PRINTER_PORT` | 9100            | TCP port (9100 is standard RAW)    |
| `PORT`         | 3001            | HTTP port for this server          |

## Running with pm2 (production)

```bash
npm install -g pm2
pm2 start printServer.js --name nativa-print
pm2 save
pm2 startup   # follow the printed instructions to auto-start on boot
```

## Finding your printer's IP

- Run `arp -a` in a terminal to list devices on the local network.
- Check your router's DHCP client list and look for the printer's hostname/MAC.
- Most Epson thermal printers print a network configuration page when you hold the feed button on power-up.

## Supported printer models

- **Epson TM series** — TM-T20, TM-T82, TM-T88 (all variants)
- **Star SP series** — SP700, TSP100, TSP650 (use StarPRNT mode if available)
- Any printer that accepts standard ESC/POS commands over TCP port 9100

## API

| Method | Path      | Description                              |
|--------|-----------|------------------------------------------|
| POST   | `/print`  | Print a receipt or comanda (see below)   |
| GET    | `/health` | Returns `{ ok: true, printer: "<ip>" }` |

### POST /print body

```json
{
  "type": "receipt",
  "businessName": "Nativa",
  "items": [{ "name": "Latte", "qty": 2, "price": 55 }],
  "total": 110,
  "paymentMethods": [{ "method": "Efectivo", "amount": 110 }],
  "loyaltyRedeemed": 0,
  "orderNote": "",
  "orderId": "ABC123",
  "footerMessage": "Gracias por tu visita"
}
```

Set `"type": "comanda"` to print a kitchen/bar ticket (no prices).
