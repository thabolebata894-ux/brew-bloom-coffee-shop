# Brew & Bloom — Coffee Shop POS

This project is a full-stack coffee shop ordering and point-of-sale app. The React frontend uses Tailwind CSS for its warm off-white, espresso, and botanical-green Brew & Bloom visual system. The Express backend stores menu items and orders in Redis when available, and falls back to an in-memory store when Redis is not configured.

## Project structure

- `backend/` — Express API and Redis-ready backend
- `frontend/` — React customer portal and staff dashboard UI
- `docs/` — project documentation and contribution report
- `screenshots/` — screenshots and deployment evidence

## Features

- Interactive menu filtering for coffee, tea, pastries, and other items
- Slide-in cart, quantity controls, dine-in table assignment, delivery address and phone capture, and four-digit daily order tickets
- Staff POS with walk-in order entry, table availability, 20-minute check reminders, table release, and order cancellation
- Staff POS with a four-stage order Kanban, menu inventory management, and daily revenue summary
- Brewing process feature and custom botanical cup brand mark
- Health-check endpoint for deployment testing

The staff login is a UI-only demo gate: any non-empty staff ID and password opens the dashboard. No credential verification is implemented, so this must not be used as production authentication.

Menu items and orders persist across restarts when Redis is configured with `REDIS_URL`. If Redis is unavailable or not configured, the backend uses an in-memory fallback and data is lost when the server stops.

If the menu cannot reach the API, the customer page shows the request error and a retry button instead of appearing empty.

## Backend setup

1. Open a terminal in the `backend` folder.
2. Install dependencies:
   npm install
3. Start the server:
   npm start
4. Default API URL:
   http://localhost:4000

Keep the backend running while using the frontend. In development, Vite forwards `/api` requests to this server.

## Frontend setup

1. Open a terminal in the `frontend` folder.
2. Install dependencies:
   npm install
3. Start the frontend:
   npm run dev
4. Default UI URL:
   http://localhost:5173

The frontend build uses Tailwind CSS through PostCSS; dependencies and scripts are defined in `frontend/package.json`.

## Environment variables

Create a `.env` file in the backend. Set the table count to match the shop layout:

REDIS_URL=redis://localhost:6379
PORT=4000
TABLE_COUNT=12
TABLE_REMINDER_MINUTES=20

## API endpoints

- GET /api/health
- GET /api/menu
- GET /api/menu/:id
- POST /api/menu
- PUT /api/menu/:id
- DELETE /api/menu/:id
- GET /api/orders
- GET /api/orders/:id
- POST /api/orders
- PATCH /api/orders/:id/status
- PATCH /api/orders/:id/cancel
- GET /api/tables
- PATCH /api/tables/:tableNumber/release

For `POST /api/orders`, `fulfillmentType` can be `dine-in` or `delivery`. Delivery orders require `deliveryPhone` and `deliveryAddress`; `deliveryLocation` may optionally contain numeric `latitude` and `longitude`. Delivery orders do not reserve a table. Delivery pricing and service-area checks are not configured.

## Deployment notes

### Live deployment (connected)

| Component | URL |
| --- | --- |
| Frontend (Vercel) | https://frontend-ten-alpha-29.vercel.app |
| Backend API (Render) | https://brew-bloom-backend.onrender.com |

The frontend is built with `VITE_API_URL=https://brew-bloom-backend.onrender.com` (set for both Production and Preview in Vercel), and `frontend/src/api/api.js` falls back to that origin for production builds if the variable is ever missing. The integration was verified end to end, including a live order and its cancellation: see `docs/deployment-report.md` (Markdown) or `docs/Brew and Bloom - Deployment and Integration Report.docx` (Word, with the screenshots embedded) and the images in `screenshots/`.

- The React/Vite frontend is ready to deploy to Vercel. Import the repository in Vercel and set the project root directory to `frontend`; Vercel will use `npm run build` and `dist`. `frontend/vercel.json` routes direct page visits back to the React app.
- The root `render.yaml` configures the Express backend as a Render web service. After importing the GitHub repository into Render, provide `REDIS_URL` from Redis Cloud as a secret environment variable. The selected free Redis Cloud tier has no persistence guarantee; use a tier with persistence enabled if data must survive Redis restarts.
- In the Vercel project settings, `VITE_API_URL` is set for Production and Preview to `https://brew-bloom-backend.onrender.com` (do not append `/api`). Redeploy after changing it.
- The frontend also needs the backend to allow its Vercel domain through CORS. Configure `VITE_API_URL` before building so API requests use the deployed backend instead of the local Vite proxy.

## Assignment completion summary

The API assigns each dine-in order the next available table and a four-digit daily ticket number. The customer sees the assigned table and ticket; staff can record walk-in orders, check tables flagged after the configured reminder interval, cancel mistaken tickets, and mark tables free after guests leave. Menu categories are stored with menu items and support Coffee, Tea, Pastries, and Other; legacy items without a category are categorized from their name/description by the frontend. New menu item IDs and order IDs are generated as UUIDs.
