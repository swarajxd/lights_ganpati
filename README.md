# ESP32 LED Cloud Controller

A mobile-friendly Next.js + Vercel controller for the 5-LED ESP32 project.

## Architecture

Phone / laptop
→ Vercel website
→ Vercel API
→ Supabase `device_state`
→ ESP32 polls Supabase
→ LEDs

The ESP32 never needs a public inbound port. It makes outbound HTTPS requests to Supabase.

## Supabase table

Use the existing `device_state` table with one row:

- `id`: 1
- `device_id`: `esp32-01`
- `mode`: `manual`
- `led1` ... `led5`: 0–80
- `speed1` ... `speed5`: milliseconds

## Environment variables

Create `.env.local` for local development:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
AUTH_USERNAME=admin
AUTH_PASSWORD=jaju
SESSION_SECRET=put-a-long-random-string-here
```

Never commit `.env.local`.

For Vercel, add the same variables under Project Settings → Environment Variables.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## GitHub

Create a GitHub repository and upload all project files except `.env.local`.

Then connect the repository to Vercel.

## Vercel

Import the GitHub repository into Vercel.

Add these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `AUTH_USERNAME`
- `AUTH_PASSWORD`
- `SESSION_SECRET`

Redeploy after adding them.

## Security

The Supabase Secret key is used only in server-side Vercel API routes. It must never be placed in browser code, committed to GitHub, or put into the ESP32 sketch.

The browser talks to `/api/state`; the Vercel server talks to Supabase.

The ESP32 should continue using the Supabase Publishable key for its read-only polling.

## Current UI

- Login
- Individual LED selection
- Brightness control
- Wave start
- Wave stop
- Individual wave speed
- Mobile-friendly layout inspired by the supplied smart-light UI
