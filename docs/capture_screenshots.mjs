/**
 * Food Eagle — screenshot capture for the documentation PDF.
 *
 * Drives the running dev server with Playwright (installed Edge), signs in to
 * each of the four role apps and saves one PNG per key screen into
 * `screenshots/`, plus `screenshots/figures.json` (the ordered figure list the
 * PDF builder reads).
 *
 *   node docs/capture_screenshots.mjs [baseUrl]
 *
 * Defaults to http://localhost:4200.
 */
import { chromium } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4200';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const figures = [];
let n = 0;

const browser = await chromium.launch({ channel: 'msedge' });

const phone = { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };

const context = await browser.newContext(phone);
const page = await context.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 200)));

const settle = (ms = 1400) => page.waitForTimeout(ms);

/** Save one figure (viewport-sized screenshot). */
async function shot(file, group, caption) {
  n += 1;
  const padded = String(n).padStart(2, '0');
  const path = `${OUT}/${padded}-${file}.png`;
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(500);
  await page.screenshot({ path });
  figures.push({ n, path, group, caption });
  console.log(`saved ${path} — ${caption}`);
}

/** Clear the session only, keeping the shared ledger on this device. */
async function signOut() {
  await page.evaluate(() => localStorage.removeItem('CapacitorStorage.fe_session'));
}

async function loginAs(role) {
  await signOut();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await settle(1200);
  await page.getByRole('button', { name: new RegExp(role) }).first().click();
  await settle(400);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await settle(2600);
}

async function go(path, ms = 1600) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await settle(ms);
}

// ── Brand / auth ──────────────────────────────────────────────────────────
await go('/login', 1600);
await shot('login', 'Getting started', 'The shared sign-in screen, with one demo account per role listed underneath the form.');

// ── Customer app ──────────────────────────────────────────────────────────
await page.getByRole('button', { name: /Customer/ }).first().click();
await settle(300);
await page.getByRole('button', { name: 'LOGIN' }).click();
await settle(2600);

await shot('location-setup', 'Getting started', 'First run asks the customer where on campus the order should be delivered.');
await page.getByRole('button', { name: /SAVE AND CONTINUE/i }).click();
await settle(2400);

await shot('customer-home', 'Customer app', 'The shopper dashboard: search, deal carousel, categories and top-rated campus dishes.');

// Dish detail modal.
await page.locator('.fav-card').first().click();
await settle(1600);
await shot('dish-detail', 'Customer app', 'Tapping a dish opens its detail sheet, where the quantity is chosen before adding to the cart.');
await page.locator('.cart-pill').first().click();
await settle(2400); // modal dismisses itself, the "added to cart" toast expires

// A second and third dish, added straight from the card's "+" button.
await page.locator('.fav-card .add-btn').nth(1).click();
await settle(1000);
await page.locator('.fav-card .add-btn').nth(2).click();
await settle(2400);

await go('/cart', 1800);
await shot('cart', 'Customer app', 'The cart groups items by store and totals the basket with the delivery fee before checkout.');

// Straight from the cart, so the checkout page inherits the loaded basket.
await page.getByRole('button', { name: /Checkout/i }).first().click();
await settle(2200);
await shot('checkout', 'Customer app', 'Checkout collects the delivery spot and payment method, then writes the order to the shared ledger.');

const place = page.getByRole('button', { name: /CONFIRM & PLACE ORDER/i });
if (await place.count()) {
  await place.click();
  await settle(3000);
  await shot('order-success', 'Customer app', 'The confirmation screen shown once the order is placed and sent to the kitchen.');

  await go('/orders', 2200);
  await shot('orders', 'Customer app', 'The customer order history, showing live status and past orders.');
}

await go('/profile-hub', 1800);
await shot('profile', 'Customer app', 'The profile hub: saved addresses, notifications, security and the help centre, above account details.');

await go('/search', 1800);
await page.locator('ion-searchbar input').first().fill('siomai');
await settle(2000);
await shot('search', 'Customer app', 'Search matches the shared catalogue as the customer types, and offers the Exa web search below it.');

// ── Vendor app ────────────────────────────────────────────────────────────
await loginAs('Restaurant');
await settle(2000);
await shot('vendor-home', 'Restaurant app', 'The vendor home: today\'s order counts and sales, the live queue and the accepting-orders switch.');

await go('/vendor/orders', 2200);
await shot('vendor-orders', 'Restaurant app', 'New tickets land here; the kitchen accepts, cooks and flags orders ready for pickup.');

await go('/vendor/menu', 2000);
await shot('vendor-menu', 'Restaurant app', 'The catalogue editor — the vendor adds, edits, prices and marks dishes sold out.');

await go('/vendor/store', 1800);
await shot('vendor-store', 'Restaurant app', 'Store profile settings: the store\'s details, campus spot, operating hours and the pause-trading switch.');

await go('/vendor/earnings', 1800);
await shot('vendor-earnings', 'Restaurant app', 'Earnings: net payout after the 10% platform fee, each settled order and the payout summary.');

// ── Rider app ─────────────────────────────────────────────────────────────
await loginAs('Rider');
await settle(2200);
await shot('rider-home', 'Rider app', 'The rider\'s Today screen: duty status, ready pickups to claim and the active run.');

// Claim the ready pickup, run it and close it out, so the history screens
// below show a real delivery rather than an empty ledger.
const claim = page.getByRole('button', { name: 'Claim' }).first();
if (await claim.count()) {
  await claim.click();
  await settle(2400);
  await shot('rider-active', 'Rider app', 'A claimed order becomes the rider\'s active run, with the drop-off and fee in view.');

  const start = page.getByRole('button', { name: /Start delivery/i }).first();
  if (await start.count()) {
    await start.click();
    await settle(2000);
  }
  const done = page.getByRole('button', { name: /Complete delivery/i }).first();
  if (await done.count()) {
    await done.click();
    await settle(2400);
  }
}

await go('/rider/earnings', 2000);
await shot('rider-earnings', 'Rider app', 'Rider earnings: lifetime total, the flat per-drop rate and the weekly payout rules.');

await go('/rider/profile', 1800);
await shot('rider-profile', 'Rider app', 'The rider profile: vehicle, contact details and availability.');

// ── Admin panel ───────────────────────────────────────────────────────────
await page.setViewportSize(desktop.viewport);
await loginAs('Admin');
await settle(2400);
await shot('admin-dashboard', 'Admin panel', 'The platform dashboard: order volume, revenue, store league table and rider activity.');

await go('/admin/orders', 2200);
await shot('admin-orders', 'Admin panel', 'The full order ledger, filterable by status and store.');

await go('/admin/stores', 2000);
await shot('admin-stores', 'Admin panel', 'Store administration: approval state, order counts and sales per store, with verify and pause actions.');

await go('/admin/riders', 2000);
await shot('admin-riders', 'Admin panel', 'The courier pool with availability, completed runs and earnings.');

await go('/admin/users', 2000);
await shot('admin-users', 'Admin panel', 'Every account on the platform, grouped by role.');

writeFileSync(`${OUT}/figures.json`, JSON.stringify(figures, null, 2));
console.log(`\n${figures.length} figures → ${OUT}/figures.json`);
await browser.close();
