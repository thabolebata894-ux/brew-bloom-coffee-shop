# Contribution Report

## Group members

| # | Member | Area | Lead responsibility |
| --- | --- | --- | --- |
| 1 | Thabo Lebata | Frontend | Customer journey — menu, filtering, cart, checkout and confirmation |
| 2 | Katleho Ntshenyeho | Backend | Orders, table assignment, ticket numbers, status changes and cancellation |
| 3 | Nthabeleng Sekonyela | Backend | Data layer, Redis persistence with memory fallback, menu CRUD, validation and tests |
| 4 | Zibathela Mothoalo | Frontend | Staff POS dashboard, table reminders, menu management and the Tailwind design system |
| 5 | Tsekiso Mathe | Deployment | Vercel and Render configuration, frontend–backend integration and live verification |
| 6 | Thabo Chaba | Documentation | README, deployment report, contribution report, accessibility and UI review |

## Responsibilities

- Built the Express.js REST API for menu, order and table management, including the serialised state-change queue that keeps table assignment consistent under concurrency
- Added Redis-ready persistence with an automatic in-memory fallback, safe JSON parsing and menu normalisation on startup
- Designed the React customer menu, cart drawer, dine-in and delivery checkout, and the order confirmation page
- Built the staff POS dashboard with a four-stage order Kanban, walk-in order entry, table availability and 20-minute check reminders, table release, cancellation and menu management
- Created the Brew & Bloom visual system in the Tailwind theme and the shared API client used by both sides of the app
- Wrote the README, the deployment and integration report, and the oral defence preparation notes
- Validated the backend with nine automated tests and verified the deployed integration end to end with eleven screenshots

## Collaboration notes

The project was organised through a shared GitHub repository, with work divided by area — backend, frontend, deployment and documentation — and integrated through commits on `main`. Tasks were paired so that each area had a primary owner and a second member who could review and explain it, which is also how the oral defence is prepared.
