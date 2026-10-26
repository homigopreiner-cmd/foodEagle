/**
 * Food Eagle — capture one screenshot of every page in the app.
 *
 * Walks each route in its correct session (signed out for onboarding, and the
 * matching account for the customer, restaurant, rider and admin apps) and
 * writes a PNG named after the page into `src/app/screenshots/`.
 *
 *   node docs/capture_all_pages.mjs [baseUrl]
 *
 * Defaults to http://localhost:4200.
 */
import { chromium } from 'file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:4200';
const OUT = 'src/app/screenshots';
mkdirSync(OUT, { recursive: true });

const PHONE = { width: 430, height: 932 };
const DESKTOP = { width: 1440, height: 900 };

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', String(e).slice(0, 160)));

const saved = [];
const skipped = [];

const settle = (ms = 1500) => page.waitForTimeout(ms);

/** Screenshot the current page, named after the page itself. */
async function save(name, expectPath) {
  await settle(500);
  const url = new URL(page.url());
  if (expectPath && !url.pathname.startsWith(expectPath)) {
    console.log(`  ! ${name}: ended up on ${url.pathname}, not ${expectPath}`);
    skipped.push({ name, url: url.pathname });
    return;
  }
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file });
  saved.push(name);
  console.log(`  ${name}.png  ${url.pathname}${url.search}`);
}

async function go(path, ms = 1700) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await settle(ms);
}

async function signOut() {
  await page.evaluate(() => localStorage.removeItem('CapacitorStorage.fe_session'));
}

async function loginAs(role) {
  await signOut();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await settle(1400);
  await page.getByRole('button', { name: new RegExp(role) }).first().click();
  await settle(350);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await settle(2800);
}

// ── Signed out: splash, onboarding and the auth pages ─────────────────────
console.log('Onboarding (signed out)');
await go('/splash', 1200);
await save('splash', '/splash');
await go('/walkthrough');
await save('walkthrough', '/walkthrough');
await go('/login');
await save('login', '/login');
await go('/create-account');
await save('create-account', '/create-account');
await go('/google-signup');
await save('google-signup', '/google-signup');
await go('/facebook-signup');
await save('facebook-signup', '/facebook-signup');
await go('/tiktok-signup');
await save('tiktok-signup', '/tiktok-signup');
await go('/otp');
await save('otp', '/otp');
await go('/forgot-password');
await save('forgot-password', '/forgot-password');

// ── Customer app ──────────────────────────────────────────────────────────
console.log('Customer app');
await loginAs('Customer'); // first sign-in lands on the delivery-location step
await save('location-setup', '/location-setup');
await page.getByRole('button', { name: /SAVE AND CONTINUE/i }).click();
await settle(2400);
await save('dashboard', '/dashboard');

await go('/categories');
await save('categories', '/categories');

// The menu is a query-string page, so open a category the way a customer does.
await page.locator('.category-item, [class*="category"]').first().click();
await settle(2200);
await save('items', '/items');

await go('/restaurant-detail?vendor=red-eagle-nook', 2200);
await save('restaurant-detail', '/restaurant-detail');

// Fill the cart and the favourites so those pages show real content.
await go('/dashboard', 2200);
for (const i of [0, 1, 2]) {
  await page.locator('.fav-card .fav-heart').nth(i).click();
  await settle(400);
}
for (const i of [0, 1, 2]) {
  await page.locator('.fav-card .add-btn').nth(i).click();
  await settle(700);
}
await settle(1800);

await go('/cart', 2000);
await save('cart', '/cart');

await page.getByRole('button', { name: /Checkout/i }).first().click();
await settle(2200);
await save('checkout', '/checkout');

await page.getByRole('button', { name: /CONFIRM & PLACE ORDER/i }).click();
await settle(3000);
await save('order-success', '/order-success');

await go('/orders', 2200);
await save('orders', '/orders');

await go('/search', 1800);
await page.locator('ion-searchbar input').first().fill('siomai');
await settle(2200);
await save('search', '/search');

await go('/favorites');
await save('favorites', '/favorites');
await go('/profile-hub');
await save('profile-hub', '/profile-hub');
await go('/notification-center');
await save('notification-center', '/notification-center');
await go('/help-center');
await save('help-center', '/help-center');
await go('/saved-addresses');
await save('saved-addresses', '/saved-addresses');
await go('/security');
await save('security', '/security');

// ── Restaurant / vendor app ───────────────────────────────────────────────
console.log('Restaurant app');
await loginAs('Restaurant');
await settle(1600);
await save('vendor-home', '/vendor');
for (const [name, path] of [
  ['vendor-orders', '/vendor/orders'],
  ['vendor-menu', '/vendor/menu'],
  ['vendor-store', '/vendor/store'],
  ['vendor-earnings', '/vendor/earnings'],
]) {
  await go(path, 2000);
  await save(name, path);
}

// ── Delivery rider app ────────────────────────────────────────────────────
console.log('Rider app');
await loginAs('Rider');
await settle(1800);
await save('rider-home', '/rider');
for (const [name, path] of [
  ['rider-deliveries', '/rider/deliveries'],
  ['rider-earnings', '/rider/earnings'],
  ['rider-profile', '/rider/profile'],
]) {
  await go(path, 2000);
  await save(name, path);
}

// ── Admin panel (desktop) ─────────────────────────────────────────────────
console.log('Admin panel');
await page.setViewportSize(DESKTOP);
await loginAs('Admin');
await settle(2000);
await save('admin-dashboard', '/admin');
for (const [name, path] of [
  ['admin-orders', '/admin/orders'],
  ['admin-stores', '/admin/stores'],
  ['admin-riders', '/admin/riders'],
  ['admin-users', '/admin/users'],
]) {
  await go(path, 2200);
  await save(name, path);
}

await browser.close();
console.log(`\n${saved.length} pages saved to ${OUT}/`);
if (skipped.length) {
  console.log('Not saved (guard redirected):', skipped.map(s => `${s.name} → ${s.url}`).join(', '));
}
