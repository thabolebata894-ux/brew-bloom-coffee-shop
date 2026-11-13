# Brew & Bloom — Oral Defence / Q&A Preparation Notes

**Project:** Brew & Bloom — Coffee Shop Management Web Application
**Live site:** https://frontend-thabolebata894-1162s-projects.vercel.app
**Backend:** https://brew-bloom-backend.onrender.com/api/health
**Repository:** https://github.com/thabolebata894-ux/brew-bloom-coffee-shop
**Date:** 13 November 2026

**How to use these notes:** each member has a 60-second answer, the files they must be able to open, and the questions most likely to come to them. Learn the *ideas*, not the wording. Nobody is expected to recite code — you are expected to explain your own decisions.

---

## 1. The 30-second project pitch (everyone must be able to say this)

> Brew & Bloom is a full-stack coffee shop app. Customers browse the menu, filter by category, add items to a cart, choose dine-in or delivery, and receive a table number and a four-digit daily ticket. Staff log into a dashboard where they see incoming orders on a Kanban board, take walk-in orders, watch table occupancy with a 20-minute check reminder, cancel mistakes, and mark tables free.
>
> The frontend is React with Vite and Tailwind CSS, deployed on Vercel. The backend is Node.js with Express, deployed on Render, with data in Redis and an automatic in-memory fallback. The two are connected by a `VITE_API_URL` environment variable pointing the frontend at the Render API.

**If asked "what is it built with?"** — React 18 + Vite 5 + Tailwind CSS 3 + react-router 6 + framer-motion; Node 18 + Express 4 + the `redis` client; Redis for storage; Vercel + Render for hosting.

---

## 2. Member 1 — Backend, API and project setup

**Name:** ______________________

### Your 60-second answer

> I built the Express API and the server-side logic. There is one Express app in `backend/server.js` exposing thirteen REST endpoints under `/api`: health, menu CRUD, orders, and tables. Data lives in Redis under three keys — `coffee_shop:menu`, `coffee_shop:orders`, `coffee_shop:tables` — and if Redis is unavailable the server transparently continues with an in-memory store, so the app still runs for a demo.
>
> The part I am proudest of is the order logic. When a dine-in order arrives, the server validates the request, checks each item exists and is available, finds the first free table, marks it occupied with the order ID and timestamp, and issues the next four-digit ticket for that day using a Redis counter keyed by date. All of that happens inside one serialised state change, so two customers ordering at the same moment cannot be given the same table.

### Files you must be able to point at

- `backend/server.js` — the whole API
- `backend/test/api.test.js` — 9 automated tests
- `render.yaml` — deployment configuration
- `backend/.env.example` — the environment variables

### Likely questions

**Q: Walk me through what happens when a customer places an order.**
The frontend sends `POST /api/orders` with the customer name, items, and `fulfillmentType`. The server validates the payload — name present and under 80 characters, at least one item, each item with an ID and a positive whole-number quantity; delivery additionally needs a phone and an address. It then looks up every item in the menu so the prices come from the database and not from the browser (never trust the client with money). For dine-in it finds the first table with status `available`, refuses with 409 if there is none, builds the order with a UUID, subtotal, `Pending` status and the four-digit ticket, then writes orders and tables together. Delivery skips the table entirely.

**Q: How do you stop two people booking the same table?**
State changes go through a single serialised queue (`runStateChange`). Each order reads the tables, picks a free one, marks it occupied, and writes back before the next order is processed. If all twelve are taken the API returns 409 with a clear message instead of overbooking. There is a test for exactly this — concurrent orders receive unique tables, and a full set of tables rejects new orders.

**Q: Why Redis, and what happens if it dies?**
Redis gives us persistence across restarts, which memory alone does not. At startup the server pings Redis; if the ping fails it sets `redisAvailable = false` and serves everything from an in-memory object instead. The `/api/health` endpoint reports which mode is active — `database: "redis"` or `"memory"` — which is how we could prove the live deployment is really using Redis. The trade-off is that in memory mode data is lost on restart, and we say so in the README.

**Q: What does the health endpoint do?**
`GET /api/health` pings Redis and returns `{ status, database, tableReminderMinutes }`. It is also the Render health check path, so Render knows the service is alive. On the live site it returns `{"status":"ok","database":"redis","tableReminderMinutes":20}`.

**Q: How are ticket numbers generated?**
A per-day counter keyed `coffee_shop:order_counter:YYYY-MM-DD`. On Redis we use `INCR`, which is atomic, and set a two-day expiry so old counters clean themselves up. The number is padded to four digits, so the first order of the day is `0001`. If the shop somehow passes 9999 orders in a day, the API returns 503 rather than issuing a five-digit ticket.

**Q: Is the API secure?**
Partly, and I want to be straight about it. The input validation is real — types, lengths, quantities, price integrity, and delivery coordinates are all checked. CORS is currently open to any origin, and the menu write endpoints and the staff routes are not authenticated; the staff login is a UI-only gate. For a production system I would add JWT authentication, restrict CORS to the Vercel domain, and rate-limit order creation. We listed that as a known limitation rather than pretending it was finished.

**Q: Why 409 for a full restaurant and not 400?**
400 means the request itself was malformed. 409 Conflict means the request was well-formed but conflicts with the current state of the resource — in this case, no tables left. It lets the frontend tell the customer "please ask staff" instead of "your input is wrong".

**Q: What do the tests cover?**
Nine tests using Node's built-in test runner: health, menu listing, adding and deleting a menu item with a unique ID, placing an order and moving its status, concurrent table assignment plus rejection when full, cancelling an order releasing the table, delivery requiring contact details but not reserving a table, rejection of missing delivery details, and rejection of invalid quantities. Run them with `npm test` in `backend/`.

**Q: Why one big `server.js` instead of controllers and routes folders?**
The repository contains the scaffolding for a layered structure — `controllers/`, `routes/`, `middleware/`, `config/` — but the running implementation is in `server.js` because it kept the Redis fallback and the serialised writes in one visible place during development. With more time or more developers I would split it, and the folders are already there for that.

**Q: What was the hardest backend problem?**
Keeping the state consistent when two things change at once — an order taking a table, or a cancellation freeing one. Writing orders and tables in a single call (`writeCollections`) instead of two separate calls was the fix that made cancellation and table assignment predictable.

---

## 3. Member 2 — Frontend, customer experience and cart flow

**Name:** ______________________

### Your 60-second answer

> I built the customer-facing React app and the cart workflow. The landing page has an intro loader, a hero section, and the menu, which loads from the API and can be filtered by Coffee, Tea, Pastries and Other. Adding an item opens a slide-in cart drawer where quantity can be changed; checkout collects a name, then either a table request for dine-in or a phone and address for delivery. On success the customer sees a confirmation page with their table number and four-digit ticket.
>
> The staff dashboard is also React — a Kanban board across the order stages, a walk-in order form, table occupancy with the 20-minute reminder, cancellation and table release. Everything talks to the API through one small `api.js` client, and I handled the loading, error and empty states so the page never just goes blank.

### Files you must be able to point at

- `frontend/src/pages/MenuPage.jsx` — menu, filtering, order placement
- `frontend/src/components/CartDrawer.jsx` — cart and checkout form
- `frontend/src/pages/StaffDashboard.jsx` — the POS dashboard
- `frontend/src/api/api.js` — the single API client

### Likely questions

**Q: Why React and Vite?**
React because the app is state-heavy — cart quantities, filtered menu, live order board — and component state plus context is a natural fit. Vite because the dev server starts in under a second and the production build is a small static bundle that Vercel can serve from its CDN with no server needed.

**Q: How does the frontend know where the backend is?**
Through `VITE_API_URL`. In development it is `http://localhost:4000` and Vite proxies `/api` there, so there are no CORS problems locally. In production Vercel injects `https://brew-bloom-backend.onrender.com` at build time. As a safety net `api.js` falls back to that same origin for production builds if the variable is missing, so a deployment can never silently point at itself.

**Q: Why was that fallback needed?**
We hit that exact bug. An earlier deployment was built before the variable existed, so the bundle called `/api/menu` on its own Vercel domain, Vercel's SPA rewrite answered with `index.html`, and the browser reported `Unexpected token '<'` when it tried to parse HTML as JSON. Now the build cannot ship without an API origin, and `api.js` checks the response content type and says "the app could not reach the API at …" instead of showing a parser error.

**Q: How is cart state shared between the menu and the drawer?**
A React context, `CartContext`. It holds the items, exposes add, remove, change-quantity and clear, and computes the subtotal, so the drawer and the menu cards read the same state instead of duplicating it in props.

**Q: How do you handle loading and errors?**
The menu page has three states: loading, error with a retry button, and loaded. A failed request shows the API's own message, which is why "All tables are currently occupied" reaches the customer verbatim. The confirmation page only renders when the order was created, so a failed order never shows a fake ticket.

**Q: How does the staff dashboard stay current?**
It fetches orders and tables on mount and after each action, and the table cards compute `needsAttention` from `occupiedAt` against the reminder interval the API reports, so the 20-minute rule lives in one place on the server rather than being hard-coded in the UI.

**Q: What is the image situation?**
Four of the five menu items have photographs in `frontend/public/images`; Black Tea deliberately uses the branded card treatment because we had no photo for it. Images are referenced by path from the menu data, so they are served as static assets from the same deployment.

**Q: What was the hardest frontend problem?**
The checkout form. Dine-in and delivery need different fields and different validation, and the button has to reflect an in-flight request without letting a double click create two orders. Splitting the form by `fulfillmentType` and disabling submit while pending solved both.

**Q: Accessibility and responsiveness — what did you do?**
Semantic sections with headings, labelled inputs, keyboard-dismissable drawer, and a layout tested at 1440x900 and on narrower widths. The screenshots in `screenshots/` were captured at 1440x900, and the dashboard was also captured full-page to show the whole board.

**Q: You used framer-motion and lucide-react — why?**
framer-motion for the drawer and reveal animations, which is cheaper than hand-writing transitions and respects reduced-motion; lucide-react for a consistent icon set without shipping a whole icon framework.

---

## 4. Member 3 — Documentation, deployment and testing

**Name:** ______________________

### Your 60-second answer

> I owned the documentation, the deployment and the end-to-end testing. I wrote the README, the contribution report, and the deployment and integration report, and I set up the two hosting platforms: the frontend on Vercel with the project root at `frontend` and an SPA rewrite so direct links do not 404, and the backend on Render from `render.yaml` with `REDIS_URL` as a secret.
>
> My main job was proving the connection actually worked rather than assuming it. I checked the health endpoint, confirmed the menu came from the API, placed a real order as a customer, found it in the staff dashboard, cancelled it, and confirmed the table went back to available — capturing eleven screenshots as evidence. When the submitted link turned out to be an older build that could not reach the API, I traced it to the missing `VITE_API_URL` at build time, documented the cause, and verified the fix on the live site.

### Files you must be able to point at

- `Readme.md` — setup, endpoints, deployment notes
- `docs/deployment-report.md` and the `.docx` — the report
- `screenshots/` — eleven pieces of evidence
- `render.yaml`, `frontend/vercel.json`

### Likely questions

**Q: How is the frontend deployed?**
Vercel, with the project root set to `frontend`. Vercel runs `npm run build` and publishes `dist`. `frontend/vercel.json` rewrites every path to `/` so React Router handles deep links instead of returning a 404 from the CDN.

**Q: How is the backend deployed?**
Render, described declaratively in `render.yaml`: a Node web service named `brew-bloom-api` in Frankfurt, free plan, root directory `backend`, `npm install` then `npm start`, health check on `/api/health`, and `REDIS_URL` supplied as a secret that is not committed.

**Q: How do you know the two are actually connected?**
Three independent proofs. The backend health endpoint reports `database: "redis"`, so it is the real deployed API and not a mock. The production bundle in the browser contains `https://brew-bloom-backend.onrender.com` as its API origin. And the menu on the live site returns the five seeded items with the same prices as the API — which can only happen if the request crossed to Render. Then the order we placed appeared in the staff dashboard and its cancellation released table 3, which exercises writes, not just reads.

**Q: What went wrong, and how did you find it?**
The submitted URL showed "Could not load menu: Unexpected token '<', `<!doctype`". That message means the browser expected JSON and received an HTML page. Reproducing it in a headless browser showed the old deployment asking its own domain for `/api/menu`, which the SPA rewrite answered with `index.html`. The cause was a build made before `VITE_API_URL` existed. Fixes: set the variable for Production and Preview, add the production fallback in `api.js`, add a content-type check with a readable error, and add a preview proxy so local previews behave like dev. Verified again in the browser: five cards, four photographs, no failed requests.

**Q: What is the difference between the deployment URL and the project domain?**
Every deployment gets its own immutable URL containing a hash. It keeps the build it was created with, forever. The project domain and the short alias always point at the current production build. That is why the old hash URL can never be repaired and the project domain is the one to mark.

**Q: What are the known limitations?**
The staff login is a UI-only gate, so it is not real authentication. Menu write endpoints are unauthenticated and CORS is open. Render's free tier sleeps when idle, so the first request can take around fifty seconds. The free Redis tier has no persistence guarantee. Delivery pricing and service-area checks are not implemented. Dine-in assumes a single shop with twelve tables. All of this is written in the report rather than hidden.

**Q: How did the group collaborate?**
Through the shared GitHub repository with separated responsibilities — backend, frontend, documentation and deployment — and commit-based integration. `docs/contribution-report.md` records the split, and the git history on `main` shows the integration commit that brought the frontend fix, the report and the screenshots together.

**Q: What would you do with two more weeks?**
Real authentication and role-based access on the staff routes, restricted CORS, rate limiting, a payment step, and automated browser tests in CI so a deployment like the one that broke the submitted link would fail before it reached production.

---

## 5. Demo script (whoever is asked to show it)

Do this in one order, and narrate each step:

1. Open the site. Wait for it — Render may need up to a minute on the first load. Say that out loud so it does not look broken.
2. Scroll to the menu. Point out the filters and that the items come from the API.
3. Add two items, open the cart, change a quantity.
4. Checkout as dine-in. Show the table number and the four-digit ticket.
5. Open the staff dashboard, show the order on the board, then cancel it.
6. Show the table back at available.
7. Open `/api/health` in another tab and show `database: "redis"`.

If the network is down in the exam room: show `docs/deployment-report.md` and the screenshots, and say the app was verified live on 13 November 2026 with the evidence attached.

---

## 6. Numbers to have ready

| Fact | Value |
| --- | --- |
| Menu items | 5 — Cappuccino R38, Latte R42, Americano R32, Blueberry Muffin R28, Black Tea R25 |
| Tables | 12 |
| Table check reminder | 20 minutes |
| Ticket format | 4 digits, resets daily (first order is 0001) |
| API endpoints | 13, all under `/api` |
| Backend tests | 9, run with `npm test` |
| Evidence screenshots | 11 |
| Hosting | Frontend Vercel, backend Render, database Redis |
| Health response | `{"status":"ok","database":"redis","tableReminderMinutes":20}` |

---

## 7. If you do not know the answer

Do not invent something. Three sentences that always work:

1. "That part was handled by [teammate] — I can explain how it connects to my part, and they can take the detail."
2. "We did not implement that; it is listed as a limitation in the report. What we did instead was …"
3. "I would need to check the code to be exact — from memory it works like this, but let me confirm."

Then say what you *do* know about the area. Honesty plus a correct surrounding explanation scores better than a confident wrong answer, and it is the difference between a fair mark and a plagiarism question.

---

## 8. Traps to avoid

- **Do not claim the staff login is secure.** It is not authentication. Say so before you are asked.
- **Do not claim the data is safe in memory mode.** It is lost on restart. Say so.
- **Do not defend the broken submitted link.** Explain the cause and the fix — that story is one of the strongest parts of the project.
- **Do not hand over a different URL from the report.** The only frontend link is `https://frontend-thabolebata894-1162s-projects.vercel.app`. The `frontend-<hash>-…` URLs are frozen snapshots.
- **Do not guess a commit hash or a line number.** Point at the file and the behaviour instead.

---

*Prepared 13 November 2026. Every claim in these notes was checked against the live deployment and the code in the repository on that date.*
