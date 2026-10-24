# Svaranusa Ticketing

Ticketing platform for the Svaranusa concert: buyers pick seats on a live seat map, pay with QRIS, and receive e-tickets by email. Staff check guests in by scanning the ticket QR code.

## Features

- **Live seat map**: seat status (available / held / sold) is pushed to every open browser over WebSockets (Laravel Reverb), so two buyers can't grab the same seat.
- **Seat hold and waitlist**: selected seats are held for a short window, and a scheduler releases expired holds every minute. Buyers can join a waitlist for a taken seat.
- **Checkout**: a configurable buyer form, Midtrans QRIS payments, and webhook-based payment confirmation.
- **E-tickets**: PDF tickets with QR codes, emailed through Resend and downloadable from the "cek tiket" page.
- **Check-in**: a scanner page for gate staff that verifies a ticket QR and marks it as used.
- **Admin dashboard**: orders, seat categories, seat maps, ticket resend, and data export.
- **Donations ("Ruang Berbagi")**: a separate QRIS donation flow.

## Tech stack

| Part | Stack |
|---|---|
| `backend/` | Laravel 12, PostgreSQL, Sanctum, Reverb, Redis, Midtrans, DomPDF, Simple QrCode, Resend |
| `frontend/` | Next.js (App Router), TypeScript, Tailwind CSS, TanStack Query, Zustand, Laravel Echo |

## Running locally

Backend:

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve           # API at http://localhost:8000
php artisan reverb:start    # WebSocket server
php artisan schedule:work   # releases expired seat holds
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

## Project structure

```
backend/
  app/Http/Controllers/Api/   REST endpoints (orders, seats, payments, check-in, admin)
  app/Events/                 SeatStatusUpdated broadcast event
  app/Jobs/                   ExpireOrderJob
  routes/api.php              API routes with per-group rate limits
frontend/
  app/(public)/beli/          purchase flow: seat map → form → payment → e-ticket
  app/admin/                  admin dashboard and scanner
  src/hooks/useSeatStatus.ts  real-time seat updates
```
