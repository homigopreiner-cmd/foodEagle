# Food Eagle

Campus food delivery — **one codebase, four apps**.

Food Eagle is an Ionic + Angular (standalone components, Capacitor) platform. The
shopper app you already had is now one of four role-based applications that share
a single data layer, which is what makes it a real marketplace instead of a
customer-only demo.

| App | Who it is for | Where it lives |
| --- | --- | --- |
| **Customer app** | Students ordering food | `/dashboard`, `/cart`, `/orders`, … |
| **Restaurant / Vendor app** | Kitchen staff taking and cooking orders | `/vendor` |
| **Delivery Rider app** | Couriers claiming and delivering orders | `/rider` |
| **Admin Panel** | Platform operator (web dashboard) | `/admin` |

---

## Quick demo

Run `npm start` and open the app. On the **first run** the platform seeds four
accounts (one per role), three campus stores, a 16-item menu and a realistic
order ledger — so every app has data the moment it opens.

The login screen lists these accounts; tap one to fill the form.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer.foodeagle@gmail.com` | `customer1234` |
| Restaurant / Vendor | `vendor.foodeagle@gmail.com` | `vendor1234` |
| Rider | `rider.foodeagle@gmail.com` | `rider1234` |
| Admin | `admin.foodeagle@gmail.com` | `admin1234` |

**The full loop, end to end:**

1. Sign in as **Customer** → add dishes to the cart → checkout. The order is
   written to the shared ledger with status `placed`.
2. Sign out, sign in as **Vendor** → *Orders → New* shows the ticket →
   **Accept** → **Start cooking** → **Ready for pickup**.
3. Sign in as **Rider** → *Today* shows the ready pickup → **Claim** →
   **Start delivery** → **Complete delivery**. The fee is credited.
4. Sign in as **Admin** → the same order is on the dashboard, in the ledger,
   in the store's league table and in the rider's stats.

You can also create a **Restaurant** or **Rider** account straight from
*Create Account* — the account type picker decides which app you land in.
Admin accounts are provisioned by the platform, never self-registered.

---

## Architecture

### Folder layout

```
src/app/
├── core/                      # Singleton infrastructure — no UI
│   ├── models/
│   │   └── platform.model.ts  # Domain types shared by all four apps
│   ├── guards/
│   │   ├── auth.guards.ts     # session required / session must NOT exist
│   │   └── role.guard.ts      # vendorGuard, riderGuard, adminGuard, customerGuard
│   └── services/
│       ├── database.service.ts    # local persistence (Capacitor Preferences)
│       ├── auth.service.ts        # accounts, sessions, roles, seeded staff
│       ├── seed.service.ts        # one-time first-run bootstrap
│       ├── menu.service.ts        # the catalogue (single source of truth)
│       ├── menu-seed.ts           # first-run dishes
│       ├── vendor.service.ts      # store profiles, approval, open/paused
│       ├── rider.service.ts       # courier pool and availability
│       ├── order.service.ts       # the shared order ledger + state machine
│       ├── cart.service.ts        # per-account cart
│       ├── items.service.ts       # customer read-view of the catalogue
│       └── user-data.service.ts   # per-customer document
├── shared/
│   └── components/            # UI used by more than one app
│       ├── curved-bottom-nav/ # customer bottom navigation
│       └── product-detail/    # dish detail modal
├── features/
│   ├── customer/pages/        # the shopper app (existing screens)
│   ├── vendor/                # Restaurant / Vendor app
│   │   ├── vendor.shell.ts    # topbar (store switcher) + tabs
│   │   ├── vendor.routes.ts
│   │   └── pages/…            # home, orders, menu, store, earnings
│   ├── rider/                 # Delivery Rider app
│   │   ├── rider.shell.ts     # topbar (online/offline) + tabs
│   │   ├── rider.routes.ts
│   │   └── pages/…            # today, deliveries, earnings, profile
│   └── admin/                 # Admin web dashboard
│       ├── admin.shell.ts     # sidebar layout, desktop-first
│       ├── admin.routes.ts
│       └── pages/…            # dashboard, orders, stores, riders, users
└── styles/
    └── platform.scss          # chrome shared by the three new apps
```

### Why one codebase?

Because the four apps are not four products — they are four **views of the same
records**. A single `PlatformOrder` row is placed by the customer, accepted by
the vendor, claimed by the rider and reported on by the admin. Splitting that
into separate projects would mean duplicating the domain and inventing an API
between them, which is exactly the kind of thing that drifts out of sync.

### Roles and routing

Every account carries a `role` (`customer` | `vendor` | `rider` | `admin`).
Routing is namespaced by role and enforced in one place:

```ts
{ path: 'vendor', loadChildren: () => import('./features/vendor/vendor.routes')… }
```

`role.guard.ts` decides who may enter, and sends anyone who wanders into the
wrong app back to **their own** homepage. A customer typing `/admin` lands on
their dashboard; an admin typing `/dashboard` lands on the console.

### The order state machine

Orders cannot be pushed into impossible states — every transition is checked
against a table in `OrderService`:

```
placed ──┬─> confirmed ──> preparing ──> ready ──> picked_up ──> delivering ──> delivered
         └─> declined (terminal)
```

* `placed → confirmed|declined` — vendor
* `confirmed → preparing → ready` — vendor
* `ready → picked_up` — rider claims it (atomically sets the rider)
* `picked_up → delivering → delivered` — rider
* Cash-on-delivery orders settle (`paid = true`) when the rider starts the run

The customer's *To Pay / To Receive / Delivered / Refunds* tabs are a
**projection** of this ledger, not a separate copy of it.

### One catalogue, several audiences

Before, dishes lived as hard-coded arrays inside customer pages — so only the
customer side could ever change them. Now `MenuService` owns the catalogue:

* the **vendor** app writes it (add / edit / delete / mark sold out)
* the **customer** app reads it (dashboard, search, categories, item lists)
* the **admin** panel counts it

Publish a dish in the vendor console and it shows up on the shopper dashboard
without restarting anything.

---

## Storage

There is no backend in this build; everything persists locally through
`@capacitor/preferences`, which works on Web, Android and iOS. Tables:

| Key | Contents |
| --- | --- |
| `fe_users` | accounts keyed by normalized email/phone, with `role` |
| `fe_session` | the signed-in session |
| `fe_vendors` | store profiles |
| `fe_menu` | `{ [vendorId]: MenuItem[] }` |
| `fe_orders` | the shared order ledger |
| `fe_riders` | courier pool |
| `fe_user_data:{id}` | per-customer document |
| `fe_cart:{id}` | per-customer cart |

Because every app on the device reads the same tables, the four roles stay in
sync live — which is what makes the end-to-end demo above work.

---

## Commands

```bash
npm start             # dev server
npm run build         # production build to www/
npm test              # unit tests (vitest)
npm run lint          # eslint
npm run search-server # Exa web-search server (http://localhost:8787)
npx cap run android   # run on a device/emulator
```

---

## Web search (Exa)

The customer **Search** screen also searches the open web — recipes, campus
food news, a store's own site — for anything the catalogue can never hold.
Those results come from [Exa](https://exa.ai) and are fetched **server-side
only**, because the API key must never be in the browser bundle:

| Piece | Where |
| --- | --- |
| Exa client, `EXA_API_KEY`, error mapping | `server.mjs` (`node:http`) |
| The route the app calls | `POST http://localhost:8787/api/web-search` |
| The Angular caller (no SDK, no key) | `src/app/core/services/web-search.service.ts` |
| The UI | `src/app/features/customer/pages/search/` → "From the web" |

The Angular app only knows the route URL (`environment.webSearchUrl`); it
never imports `exa-js` and never sees the key.

```bash
cp .env.example .env        # add your Exa key as EXA_API_KEY
npm run search-server       # terminal 1 — port 8787
npm start                   # terminal 2 — the app
```

A key is created in the [Exa dashboard](https://dashboard.exa.ai/api-keys); new
accounts start with free credits (Freebuff users can redeem `EXA20FREEBUFF` on
the dashboard billing page). `.env` is gitignored — only `.env.example` is
committed.

Failures are shown honestly instead of as an empty list: a missing or rejected
key, exhausted credits (`402`), a rate limit (`429`) or an unreachable server
each render their own message in the "From the web" section.

---



> `src.zip` at the repository root is an old snapshot of the source and is safe
> to delete — the live code is under `src/`.
