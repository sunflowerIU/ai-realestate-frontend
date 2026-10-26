# Copy Kalam frontend

Customer-facing frontend for the existing NestJS real-estate API. This standalone Next.js project lives in this folder; the backend remains at `D:\Productions\ai-realestate`.

## Run locally

1. Start Docker Desktop, then in `D:\Productions\ai-realestate` run `docker compose up -d`, `npm run db:migrate`, and `npm run dev`. Its `.env` currently sets port 3030.
2. Run `npm install` here.
3. `.env.local` points to the local backend on port 3030 and sets the contact email. Change `BACKEND_URL` there if your backend runs elsewhere.
4. Run `npm run dev` and open `http://localhost:3002`.

Check `http://localhost:3002/api/health` after both services start. A `200` response with `{"status":"connected"}` confirms that the frontend can reach the backend and its database. A `503` response means the backend is unreachable or not ready.

The public pages are `/`, `/login`, and `/contact`. Account requests open a prepared email in the visitor's email app; no email delivery service is configured.

Agent pages live under `/workspace`: overview, clients, properties, buyer requirements, activities and follow-ups, visits, deals, and notes. The notes screen uses the backend's `NOTE` activity type. Agents can create and update records, search supported collections, filter, and page through results. Client and activity deletion and property archiving follow the backend's actual endpoints. Linked records can be searched beyond the first page. Dates display in Bikram Sambat; activity and visit forms can accept A.D. or B.S. dates. Prices are whole NPR strings, and property land areas retain their entered unit.

Platform administrators use the same sign-in page and are routed to `/admin`, where they can create paid agent accounts, search the agent directory, change status, and revoke sessions. The agent and admin navigation and API routes are role-separated. There is no public registration.

Excel imports, deterministic matching, and AI are not implemented in the backend, so this frontend labels imports as planned and does not present them as working features. The backend has no standalone owner, buyer, or note table: owners are clients linked to properties, buyers are clients linked to requirements and deals, and notes are activities or fields on records.

## Checks

`npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run build` check the code. `npm run test:e2e` runs desktop and mobile Playwright checks using a locally installed Chrome browser.

Authentication and data requests pass through allowlisted same-origin Next.js route handlers to `/api/v1`. Access and rotating refresh tokens are kept in HttpOnly, SameSite=Strict cookies. Mutations check request origin. The backend remains the source of truth for roles and agent ownership. In production, configure `BACKEND_URL` to a secure backend URL and serve this app over HTTPS.

