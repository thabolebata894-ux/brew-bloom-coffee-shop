# Brew & Bloom — Oral Defence / Q&A Preparation Notes

**Project:** Brew & Bloom — Coffee Shop Management Web Application
**Live site:** https://frontend-thabolebata894-1162s-projects.vercel.app
**Backend:** https://brew-bloom-backend.onrender.com/api/health
**Repository:** https://github.com/thabolebata894-ux/brew-bloom-coffee-shop
**Date:** 13 November 2026

**How to use these notes:** you work in three pairs. Each pair owns one area and each person inside the pair has a *lead* half of that area, so no two people give the same answer. Learn the ideas, not the wording — you are being asked to defend decisions, not recite code.

## Pairing

| Pair | Area | Members | Lead focus |
| --- | --- | --- | --- |
| A | Backend API | **Katleho Ntshenyeho** | Orders, tables, ticket numbers |
| A | Backend API | **Nthabeleng Sekonyela** | Data layer, menu CRUD, validation, tests |
| B | Frontend | **Thabo Lebata** | Customer journey — menu, cart, checkout |
| B | Frontend | **Zibathela Mothoalo** | Staff POS dashboard, tables, design system |
| C | Deployment, testing and documentation | **Tsekiso Mathe** | Deployment, integration, live verification |
| C | Deployment, testing and documentation | **Thabo Chaba** | Documentation, report, accessibility and UI review |

If your real split differs, swap the names inside a section — every section is self-contained, so nothing else needs editing.

---

## 1. The 30-second project pitch (everyone must be able to say this)

> Brew & Bloom is a full-stack coffee shop app. Customers browse the menu, filter by category, add items to a cart, choose dine-in or delivery, and receive a table number and a four-digit daily ticket. Staff log into a dashboard where they see orders on a Kanban board, take walk-in orders, watch table occupancy with a 20-minute check reminder, cancel mistakes, manage menu availability, and mark tables free.
>
> The frontend is React with Vite and Tailwind CSS on Vercel. The backend is Node.js with Express on Render, storing data in Redis with an automatic in-memory fallback. The two are connected by a `VITE_API_URL` environment variable that points the frontend at the Render API.

**If asked "what stack?"** — React 18, Vite 5, Tailwind CSS 3, react-router 6, framer-motion, lucide-react; Node 18, Express 4, the `redis` client, Redis for storage; Vercel and Render for hosting.

---

## 2. Pair A — Backend API: Katleho Ntshenyeho and Nthabeleng Sekonyela

### Shared opening (either of you can say it)

> We built the Express API in `backend/server.js`. It exposes thirteen REST endpoints under `/api`: health, menu CRUD, orders, and tables. Data is stored in Redis under three keys — `coffee_shop:menu`, `coffee_shop:orders` and `coffee_shop:tables` — and if Redis cannot be reached the server continues on an in-memory store so the app still runs. We split the work by layer: Katleho owns the order and table logic, Nthabeleng owns the data layer, the menu endpoints and the test suite.

---

### Katleho Ntshenyeho — orders, tables and ticket numbers

**Your 60-second answer**

> I wrote the ordering logic. When a dine-in order arrives, the server validates it, checks every item exists and is available, finds the first free table, marks it occupied with the order ID and a timestamp, and issues the next four-digit ticket for that day. Prices are always re-read from the menu on the server, never taken from the browser. If all twelve tables are taken the API answers 409 with a clear message instead of overbooking. Cancelling an order or releasing a table puts that table back to available.

**Files you must be able to point at:** `backend/server.js` (the `POST /api/orders`, `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/cancel`, `PATCH /api/tables/:tableNumber/release` handlers), `backend/test/api.test.js`.

**Likely questions**

- **Walk me through placing an order.** `POST /api/orders` receives the customer name, items and `fulfillmentType`. Validation rejects a missing name or one over 80 characters, an empty item list, or any item without an ID and a positive whole number quantity; delivery additionally needs a phone of 7–30 characters and an address. Each item is then matched to the menu so the price comes from the database. Delivery skips tables entirely. Dine-in takes the first table with status `available`, sets it to `occupied` with `orderId` and `occupiedAt`, and writes orders and tables together in one call.
- **How do you stop two customers getting the same table?** Every state change runs through a single serialised queue (`runStateChange`), and orders plus tables are written in one `writeCollections` call. So one order finishes claiming its table before the next reads the table list. There is a test that fires concurrent orders and asserts the tables are unique, plus one that fills all tables and asserts the 409.
- **How are the four-digit tickets made?** A per-day counter keyed `coffee_shop:order_counter:YYYY-MM-DD`. On Redis it uses `INCR`, which is atomic, with a two-day expiry so old counters clean up. The value is padded to four digits, so the first order of the day is `0001`; past 9999 the API returns 503 rather than a five-digit ticket.
- **Why 409 and not 400 when the shop is full?** 400 means a malformed request. 409 Conflict means a valid request that conflicts with current state — here, no free table. It lets the UI say "please ask staff" instead of "your input is wrong".
- **What happens on cancellation?** The order status becomes `Cancelled`, the linked table is reset to `available` and its `orderId` and `occupiedAt` are cleared, so the table shows as free immediately in the dashboard.
- **What are the order statuses?** `Pending`, `Preparing`, `Ready`, `Collected`, and `Cancelled`. The status endpoint only accepts those four live stages; a cancelled order cannot be moved back into the workflow.
- **What about the reminder?** Occupancy is measured from `occupiedAt` against `tableReminderMinutes`, which defaults to 20 and comes from the environment. The dashboard flags a table once it passes that threshold; the rule is served by the API so it is only defined once.
- **Is the API secure?** Partly, and I will be direct: input validation and price integrity are real, but CORS is open, and the menu write routes and staff routes are not authenticated. Production would need JWT authentication, a restricted CORS origin and rate limiting. It is listed as a limitation, not hidden.
- **Hardest problem?** Consistency when two things change at once — an order claiming a table while another is cancelled. Writing orders and tables in one operation fixed it.

---

### Nthabeleng Sekonyela — data layer, menu CRUD, validation and tests

**Your 60-second answer**

> I built the storage layer and the menu side of the API. At startup the server pings Redis; if it answers, everything is read and written through Redis, otherwise the same logic runs against an in-memory store, and `/api/health` reports which one is active. Three collections are seeded on first run: five menu items and twelve tables. I also wrote the menu create, update and delete endpoints with ID generation and input checks, and the nine automated tests we run with `npm test`.

**Files you must be able to point at:** `backend/server.js` (the Redis connection, `readCollection` / `writeCollection`, menu routes), `backend/test/api.test.js`, `backend/.env.example`, `render.yaml` for the environment.

**Likely questions**

- **Explain the Redis fallback.** On boot we connect and `PING`. Success sets `redisAvailable = true` and seeds any missing keys. Failure sets it to false, and every read and write goes to a memory object with the same JSON shape. The health endpoint exposes `database: "redis"` or `"memory"`, so you can tell which mode is live — ours reports `redis`. The trade-off is that memory mode loses data on restart, which the README states.
- **How do you know the stored data is not corrupted?** Every read goes through `parseJson`, which returns a safe fallback if the value is missing, not JSON, or the wrong type. On boot the menu is normalised too: any price that is not a finite number at or above the minimum is reset to the minimum. That came from a hardening commit after we hit bad stored state.
- **What are the menu endpoints?** `GET /api/menu`, `GET /api/menu/:id`, `POST /api/menu`, `PUT /api/menu/:id`, `DELETE /api/menu/:id`. New items get a UUID; the five seeded items keep `menu-1` to `menu-5`. Each item has a name, description, category, price and availability flag, and the categories are Coffee, Tea, Pastries and Other.
- **What validation do the menu routes do?** A required name, a numeric price above the minimum, a category from the allowed set, and an availability flag. Update and delete return 404 when the ID does not exist rather than silently succeeding.
- **What do the nine tests cover?** Health, menu listing, adding and deleting a tea item with a unique ID, placing an order and changing its status, concurrent orders getting unique tables plus rejection when full, cancellation releasing a table, delivery requiring contact details but reserving no table, rejection of missing delivery details, and rejection of invalid quantities. They use Node's built-in runner — `npm test` in `backend/`.
- **Why Redis rather than a SQL database?** The data is small, document-shaped and read often — a menu and an order list. Redis gives fast key-value access and atomic counters for the daily ticket without a schema or migrations. A relational database would be better once we needed reporting, joins or transactions across many tables.
- **Which keys exist in Redis?** `coffee_shop:menu`, `coffee_shop:orders`, `coffee_shop:tables`, and one `coffee_shop:order_counter:YYYY-MM-DD` per day.
- **What is stored and what is computed?** Only the three collections and the counter are stored. Subtotal is computed at order time and stored on the order; revenue today, open orders and available counts are computed in the dashboard from those collections, so there is no second source of truth to drift.
- **What would you change about the storage layer?** Move from single JSON blobs to Redis hashes or a real database so two server instances could write safely, and add authentication before the menu write routes, which are currently open.

---

## 3. Pair B — Frontend: Thabo Lebata and Zibathela Mothoalo

### Shared opening (either of you can say it)

> We built the React frontend: the customer site and the staff dashboard, in one Vite app with two routes. Everything reaches the backend through one small client, `frontend/src/api/api.js`, so the API address and error handling live in a single place. We split it by user: Thabo owns the customer journey, Zibathela owns the staff dashboard and the visual system.

---

### Thabo Lebata — customer journey: menu, cart, checkout

**Your 60-second answer**

> I built the customer side. The menu loads from the API and can be filtered into Coffee, Tea, Pastries and Other; adding an item opens a slide-in cart drawer where quantities can be changed. Checkout asks for a name, then either dine-in or delivery — delivery needs a phone and address, and can attach coordinates. On success the customer sees a confirmation page with their table number and four-digit ticket. The API client also handles the loading, error and retry states, so a failed request shows a readable message instead of a blank page.

**Files you must be able to point at:** `frontend/src/pages/MenuPage.jsx`, `frontend/src/components/CartDrawer.jsx`, `frontend/src/context/CartContex.jsx`, `frontend/src/pages/OrderConfirmation.jsx`, `frontend/src/api/api.js`.

**Likely questions**

- **How does the frontend find the backend?** Through `VITE_API_URL`. In development it is `http://localhost:4000` and Vite proxies `/api`, so there are no CORS issues locally. In production Vercel injects `https://brew-bloom-backend.onrender.com` at build time, and `api.js` also falls back to that origin for production builds if the variable is missing, so a build can never silently point at itself.
- **Why did the fallback exist?** Because of a real bug we hit. A deployment was built before the variable existed, so the bundle requested `/api/menu` from its own Vercel domain, the SPA rewrite answered with `index.html`, and the browser threw `Unexpected token '<'` while parsing HTML as JSON. Now the client checks the response content type and says "the app could not reach the API at …" instead of a parser error.
- **How is cart state shared?** A React context, `CartContext`, holds the items and exposes add, remove, change-quantity and clear, and computes the subtotal. The menu cards and the drawer read the same state, so nothing is duplicated through props.
- **What is the checkout sequence?** The drawer switches into a checkout view, the customer picks dine-in or delivery, and dine-in needs only a name. Delivery requires phone and address, with an optional location button that fills coordinates. Submit is disabled while the request is in flight, which stops a double click creating two orders.
- **How do errors reach the customer?** The menu page has loading, error-with-retry and loaded states. A failed request shows the API's own message, which is how "All tables are currently occupied. Please ask staff for help." reaches the customer exactly as the server wrote it.
- **Why filter on the client?** The menu is five to a few dozen items, so filtering in memory is instant and avoids a request per tab. At a much larger menu I would move it to a query parameter.
- **How are categories decided?** Items carry a category, but older items without one are matched by name and description keywords in `MenuSection.jsx`, so legacy data still lands in the right filter instead of disappearing into "Other".
- **What is the images situation?** Four of five items have photographs in `frontend/public/images`, served as static assets from the deployment. Black Tea deliberately uses the branded card because we had no photo. If the menu request itself fails, no cards render — which is why a broken API looks like missing photos.
- **Hardest part?** The checkout form: two fulfilment modes, different required fields, and a submit button that must not double-post.

---

### Zibathela Mothoalo — staff dashboard, tables and design system

**Your 60-second answer**

> I built the staff dashboard and the visual system. The dashboard has a live Kanban across Pending, Preparing, Ready and Collected, a walk-in order form, table cards that flag a table once it has been occupied past the reminder interval, cancellation and table release, menu availability management, and a daily summary of revenue, open orders, available tables and stock. The design system is a warm off-white, espresso and copper palette defined once in the Tailwind theme, with Playfair Display for headings and Inter for body text.

**Files you must be able to point at:** `frontend/src/pages/StaffDashboard.jsx`, `frontend/src/pages/StaffLogin.jsx`, `frontend/tailwind.config.js`, `frontend/src/styles.css`, `frontend/src/components/HeroSection.jsx`.

**Likely questions**

- **How does the Kanban work?** Four columns for `Pending`, `Preparing`, `Ready` and `Collected`. Moving an order calls `PATCH /api/orders/:id/status`; cancelled orders are filtered out of the board but kept in the data for the day's totals.
- **How does the 20-minute reminder work?** Each occupied table has an `occupiedAt` timestamp from the server. The card computes minutes occupied and flags `needsAttention` when it passes `tableReminderMinutes`, which the dashboard reads from `/api/health` rather than hard-coding 20. That keeps the rule in one place.
- **Why not poll or use websockets?** The dashboard refetches after each action and on load, which is enough for a single-shop demo. Live updates across several staff devices would need polling or a socket, and I would add that next.
- **What does the walk-in form do?** Records an order taken at the counter: customer name, dine-in or delivery, phone and address when delivering, and quantities per menu item. It posts with `source: 'walk-in'` so counter sales can be told apart from online ones.
- **How does the design system work?** Colours, fonts, shadows and keyframe animations are declared once in `tailwind.config.js` as an `ember` palette, so components use tokens like `bg-ember-copper` rather than raw hex values. Changing the brand means changing the theme, not every file.
- **Where do the animations come from?** CSS keyframes registered in the Tailwind theme — the cup drawing itself, fade-up reveals, the checkmark and a soft pulse — plus framer-motion for the drawer and scroll reveals. Motion is decorative, never required to use the app.
- **Is the staff login real authentication?** No, and I will say so before you ask. It is a UI-only gate: any non-empty staff ID and password opens the dashboard, and there is no token or server check. It is a demo affordance, and the README and report both state it is not production authentication.
- **Accessibility?** Semantic sections and headings, labelled inputs tied to their controls with matching `id` and `htmlFor`, `aria-label` on quantity fields, tab roles with `aria-selected` on the dashboard tabs, and a drawer that can be dismissed by keyboard. Contrast was checked against the light palette.
- **How did you check layout?** At 1440x900, the size used for all eleven screenshots, and the dashboard was also captured full-page so the whole board is visible in one image.

---

## 4. Pair C — Deployment, testing and documentation: Tsekiso Mathe and Thabo Chaba

### Shared opening (either of you can say it)

> We handled everything after the code: hosting, the connection between the two deployments, the testing evidence, and the written submission. Tsekiso owns the deployment and the live verification, Thabo owns the documentation, the report and the accessibility and UI review.

---

### Tsekiso Mathe — deployment, integration and live verification

**Your 60-second answer**

> I deployed both halves and proved they talk to each other. The frontend runs on Vercel with the project root at `frontend`, built with `npm run build` and published from `dist`, plus an SPA rewrite so deep links do not 404. The backend runs on Render from `render.yaml` with `REDIS_URL` as a secret and a health check on `/api/health`. I verified the connection three ways: the health endpoint reports Redis, the production bundle contains the Render origin, and a real order placed on the live site appeared in the staff dashboard and its cancellation released the table.

**Files you must be able to point at:** `render.yaml`, `frontend/vercel.json`, `frontend/src/api/api.js`, `docs/deployment-report.md`, `screenshots/`.

**Likely questions**

- **How is each half configured?** Vercel: root directory `frontend`, build `npm run build`, output `dist`, and `frontend/vercel.json` rewrites every path to `/` so React Router handles navigation. Render: a Node web service named `brew-bloom-api`, region Frankfurt, free plan, root directory `backend`, install then `npm start`, health check path `/api/health`, with `REDIS_URL` supplied as a secret that is never committed.
- **How do you know they are actually connected?** Three independent proofs. One, `/api/health` returns `{"status":"ok","database":"redis","tableReminderMinutes":20}` — that is the deployed API with real Redis, not a mock. Two, the production JavaScript bundle contains `https://brew-bloom-backend.onrender.com`, so the browser is told where to send requests. Three, the live menu returns the same five items and prices as the API, which cannot happen if the request stayed on Vercel. Then a live order appeared in the staff POS and cancelling it returned table 3 to available — that proves writes, not just reads.
- **What went wrong, and how did you find it?** The submitted link showed "Could not load menu: Unexpected token '<', `<!doctype`". That message means JSON was expected and an HTML page arrived. Reproducing it in a headless browser showed the old deployment requesting `/api/menu` from its own domain, where the SPA rewrite answered with `index.html`. The cause was a build made before `VITE_API_URL` existed. We set the variable for Production and Preview, added the production fallback in `api.js`, added a content-type check with a readable error, and added a preview proxy so local previews behave like dev. Re-verified: five cards, four photographs, zero failed requests.
- **What is the difference between a deployment URL and the project domain?** Every deployment gets its own immutable URL with a hash, and it keeps that build forever. The project domain and the short alias always point at the current production build. That is why the old `frontend-gbg4vs40w-…` link can never be repaired and the project domain is the one to mark.
- **Why does the first load take so long sometimes?** Render's free tier sleeps when idle, so a cold start can take up to about fifty seconds. The first request wakes it and later requests are fast. It is a hosting limitation, not an application bug, and it is documented.
- **What are the known limitations?** UI-only staff login, unauthenticated menu writes, open CORS, free-tier sleeping, a free Redis tier without persistence guarantees, and no delivery pricing or service-area checks. All of it is in the report.
- **How would you stop this happening again?** Add an environment variable check and a smoke test to CI so a deployment that cannot reach the API fails before it goes live.
- **What is the exact link to submit?** `https://frontend-thabolebata894-1162s-projects.vercel.app` — the project domain, never a `frontend-<hash>-…` URL.

---

### Thabo Chaba — documentation, report, accessibility and UI review

**Your 60-second answer**

> I owned the written submission and the quality review. I wrote the README with setup, environment variables and every endpoint, the contribution report, and the deployment and integration report that documents the architecture, the connection configuration, the verification method, the test results and the known limitations, with all eleven screenshots embedded. I also reviewed the interface for consistency and accessibility — labels, contrast, keyboard use, and readable error states.

**Files you must be able to point at:** `Readme.md`, `docs/deployment-report.md`, `docs/Brew and Bloom - Deployment and Integration Report.docx`, `docs/viva-notes.md`, `screenshots/`.

**Likely questions**

- **What is in the report?** Submission links, architecture, how the frontend and backend are wired, the verification method, all eleven screenshots with captions, a test-results table, the issues we found and fixed, known limitations, and reproduction steps. The Word version embeds the screenshots so it can be read without the repository.
- **Why document so heavily?** Because the interesting part of this project was not writing an endpoint — it was getting two separately deployed applications to talk to each other, and the failure we hit is exactly the kind of thing a marker should be able to follow. The report shows the cause, the fix and the proof.
- **How is the README organised?** Structure, features, backend setup, frontend setup, environment variables, the full endpoint list with the delivery rules, and deployment notes for both platforms. Someone cloning the repo can run it from that file alone.
- **What did you review in the UI?** Consistent use of the palette tokens rather than ad-hoc colours, readable contrast on the light background, every input paired with a label and a matching `id`, `aria-label` on quantity controls, tab semantics on the dashboard, and error messages that say what to do rather than exposing a stack trace.
- **How do you keep the report honest?** Every number and claim in it was checked against the live site and the code on the day it was written: five menu items with prices, twelve tables, a twenty-minute reminder, thirteen endpoints, nine tests, eleven screenshots. Where something is incomplete we say so, especially the staff login and the open CORS.
- **Why a Word version as well as Markdown?** The Markdown is what lives in the repository and stays readable on GitHub; the Word file is what a lecturer can open, print and annotate without any tooling.
- **What would you improve in the documentation?** Add a short architecture diagram of the request path, a troubleshooting section for cold starts and stale deployment URLs, and API examples with request and response bodies rather than only endpoint names.

---

## 5. Demo script (Tsekiso leads, anyone can take over)

1. Open the site. **Warn them first:** Render may need up to a minute on the first load, so it is not broken.
2. Scroll to the menu. Point out the filters and say the items come from the API.
3. Add two items, open the cart, change a quantity.
4. Check out as dine-in. Point at the table number and the four-digit ticket.
5. Open the staff dashboard, find the order on the board, cancel it.
6. Show the table back at available.
7. Open `/api/health` in another tab and show `database: "redis"`.

If the network fails in the room: open `docs/deployment-report.md` and the screenshots, and say the app was verified live on 13 November 2026 with the evidence attached.

---

## 6. Numbers to have ready

| Fact | Value |
| --- | --- |
| Menu items | 5 — Cappuccino R38, Latte R42, Americano R32, Blueberry Muffin R28, Black Tea R25 |
| Tables | 12 |
| Table check reminder | 20 minutes |
| Ticket format | 4 digits, resets daily, first order is 0001 |
| Order statuses | Pending, Preparing, Ready, Collected, Cancelled |
| API endpoints | 13, all under `/api` |
| Backend tests | 9, run with `npm test` |
| Evidence screenshots | 11 |
| Hosting | Frontend Vercel, backend Render, database Redis |
| Health response | `{"status":"ok","database":"redis","tableReminderMinutes":20}` |

---

## 7. Who answers what (routing table)

| If the question is about… | Answer first | Backup |
| --- | --- | --- |
| Orders, tables, tickets, cancellation | Katleho | Nthabeleng |
| Redis, data storage, menu endpoints, tests | Nthabeleng | Katleho |
| Menu page, cart, checkout, API errors | Thabo Lebata | Zibathela |
| Staff dashboard, design system, accessibility | Zibathela | Thabo Chaba |
| Hosting, environment variables, the broken link | Tsekiso | Thabo Chaba |
| README, report, screenshots, limitations | Thabo Chaba | Tsekiso |

**Rule:** the first name answers, the backup adds one sentence at most. If the first name is unsure, the backup takes it. Never both talk at once — it reads as uncertainty.

---

## 8. If you do not know the answer

Do not invent something. Three sentences that always work:

1. "That part was handled by [name] — I can explain how it connects to my part, and they can take the detail."
2. "We did not implement that; it is listed as a limitation in the report. What we did instead was …"
3. "I would need to check the code to be exact — from memory it works like this, but let me confirm."

Then say what you *do* know about the surrounding area. Honesty plus a correct surrounding explanation scores better than a confident wrong answer, and it avoids a plagiarism question.

---

## 9. Traps to avoid

- **Do not claim the staff login is secure.** It is not authentication. Say so before you are asked.
- **Do not claim data survives a restart in memory mode.** It does not.
- **Do not defend the broken submitted link.** Explain the cause and the fix — that story is one of the strongest parts of the project.
- **Do not hand over a different URL from the report.** The only frontend link is `https://frontend-thabolebata894-1162s-projects.vercel.app`.
- **Do not guess a commit hash or a line number.** Point at the file and the behaviour instead.
- **Do not let one person answer everything.** The routing table exists because "we all did everything" is the fastest way to lose marks for individual contribution.

---

*Prepared 13 November 2026. Every claim here was checked against the live deployment and the code in the repository on that date.*
