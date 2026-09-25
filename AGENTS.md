# BOEMO JOOS FOOD DEALS — Agent Operating Contract

## Product
BOEMO Joos Food Deals is the real customer-facing ordering and lightweight operations PWA for BOEMO Joos Dealer, a mobile kitchen serving food around Botswana Accountancy College (BAC) and nearby student areas.

This is a real small-business product, not a demo, template, QA app, or generic SaaS.

## Project boundary
This AGENTS.md governs **only** `gatshaayanda/boemo-joos-food-deals`. Do not apply another project's assumptions, branding, Firebase identifiers, collections, assets, workflows or product rules here. In particular, do not confuse BOEMO with Namane Tyres, Admin Hub Games, BoardSignal, or other repositories.

## Roles
- Product owner / final reviewer: user
- Technical navigator + implementation: ChatGPT through repository tooling
- GitHub is the source of truth
- No Codex dependency

## Workflow
START → INSPECT → BUILD → VERIFY → CHECKPOINT → CONTINUE/RECOVER.
Golden rule: **Unexpected result = STOP → inspect reality → then act.**

Before changing code, inspect repository, Git state, Firebase configuration, deployed state when relevant, and the actual business workflow.

## Product model
Customer → Menu / Deals → Order ahead → Kitchen queue → Pickup or Delivery → Complete

## Customer accounts and guest ordering
Authentication is **never a prerequisite for buying food**.

The primary checkout choice is:
- **Order as Guest** — name, WhatsApp/phone, order details, pickup or delivery, then submit.
- Guest details should be saved to Firebase when a guest Firebase session can be created; local/offline ordering must not be blocked if account/session creation fails.
- Returning customers should see saved details when the same device/session is available.
- Firebase anonymous authentication may provide the guest customer UID; `customers/{uid}` stores the saved profile.
- A guest can later upgrade that profile to a durable account, including **Continue with Google**. Linking Google to the existing guest user must preserve the customer's BOEMO profile/order association.
- Email-link authentication is optional and must never be required for ordinary ordering. The Spark-plan email-link daily limit must not become a checkout dependency.
- Customer profile fields: name, email, WhatsApp/phone, optional preferred delivery location, optional notes.
- Customers may read/write only their own profile. Customer order reads are limited to orders associated with their authenticated UID; admin owner/staff retain operational access.

## Customer experience
Make these obvious on a phone:
- today's food
- supplied deals and prices
- mobile kitchen location
- serving hours
- order-ahead
- pickup or delivery
- delivery landmark/instructions
- contact fallback

Do not invent payment confirmation, opening hours, delivery guarantees, testimonials, stock, or a fixed address.

## Supplied menu
Monday: Ke Starch, Beetroot, Pumpkin, Chicken + Stew, Soup, Drink of Choice
Tuesday: Samp & Stew
Wednesday: Pap, Braai, Chicken, Morogo
Thursday: Dumplings & Chicken
Friday: Hot Dog & Fries

Supplied deals:
Beggar & Chips P30 / Bring a Friend P25
Hot Dog P25 / Bring a Friend P20
Potatoes P10
Cup Drink P8 / Bring a Friend 2 for P15
Still Water P7 / Bring a Friend 2 for P10
Sausage & Chips P30
Combo Sausage + Chips + Drink P40
Beggar + Chips + Drink P40

## Ordering
Orders preserve item and price snapshots.
Modes: pickup or delivery.
Orders may include an optional `customerId` so guest orders can become part of a customer's future history without changing the fast guest checkout.
Delivery captures location/landmark, phone and instructions.

Statuses:
New → Accepted → Preparing → Ready → Delivering / Collected → Delivered
with Cancelled available.

A submission is not the same as business acceptance. Offline wording must never claim the kitchen received an unsynchronized order.

## Offline-first PWA
Maintain installable manifest, service worker, offline route, public app-shell caching and Firestore persistent local cache. Never cache private Firebase API responses indiscriminately or large media blobs in the shell.

## Firebase
BOEMO must use its own dedicated Firebase project. Never reuse another application's identifiers, credentials, collections, seed data or rules. Browser config uses NEXT_PUBLIC_FIREBASE_* only.

## Firestore boundary
Public customers may create validated orders. Authenticated customers may access only their own `customers/{uid}` profile and associated orders. admins/{uid}.role owner/staff may read/update operational orders and manage future menu/business settings. Never expose customer profiles publicly or weaken rules to hide UI/configuration problems.

Never weaken rules to hide UI/configuration problems.

## Admin
/admin is a practical kitchen operations surface: today's queue, order details, status updates and delivery queue, plus owner-controlled menu and today's location/serving hours. Do not build a generic CRM/ERP/accounting system.

The admin gate accepts Google or Email/Password Firebase users, but access is granted only when `admins/{uid}.role` is `owner` or `staff`. The first owner must be bootstrapped in Firebase Console; never hard-code an admin UID into the app.

The public home and customer order page must use the Firestore `menu` collection as the source of truth. The first authorized Kitchen load seeds the supplied starter menu into Firestore with stable IDs; the owner/staff can then CRUD those same records. Do not reintroduce hard-coded menu/deal fallbacks. If no menu is published or the menu cannot be loaded, show a clear BOEMO phone fallback (76425849 / 76769834) instead of inventing or silently restoring old prices. Starter daily meals whose prices were not supplied are seeded unpublished until the owner enters the real price and makes them available. An online order failure must be surfaced as an online/Firebase error; do not mislabel an online write timeout as an offline save.

## Menu source of truth
- `menu/{stable-id}` records are the customer-facing source of truth for daily food and deals.
- The first authorized Kitchen load seeds the supplied starter menu once and records a `businessSettings/menu-seed-v1` marker so deleting menu items later is a real CRUD action and does not silently reseed them.
- Supplied daily meal names without supplied prices start unpublished (`available=false`) to prevent accidental zero-price ordering; the owner must set the real price and publish them.
- If the public app has no published menu, direct customers to call BOEMO on 76425849 / 76769834 rather than showing stale hard-coded menu data.

## Media
Use supplied BOEMO food assets under public/boemo-assets/. Do not use inherited Namane assets as BOEMO content.

## Technical baseline
Next.js 15, React 19, TypeScript, Firebase Auth, Firestore persistent local cache, Storage when needed, PWA/service worker, Vercel Analytics/Speed Insights.

## Build discipline
Before a meaningful checkpoint:
npx tsc --noEmit
npm run lint
npm run build

Do not run npm audit fix --force blindly. Never commit private credentials.

## Checkpoint
Review the actual diff before committing. Commit meaningful checkpoints. Avoid unnecessary Vercel deployments.
## Firebase environment and build safety
- Firebase web configuration is public client configuration and must come from `NEXT_PUBLIC_FIREBASE_*` environment variables in deployed/runtime environments.
- The Firebase client contains non-secret build placeholders so CI can prerender client routes when those environment variables are intentionally absent. Those placeholders are not a Firebase project and must never be treated as runtime configuration.
- Before live Firebase testing, confirm the deployment has the real BOEMO Firebase environment variables for the relevant environment.
- Anonymous Authentication is enabled in the BOEMO Firebase project. Guest checkout should therefore create an anonymous Firebase user when the client is online and configured correctly; checkout must still retain its guest fallback if authentication cannot be established.

## Menu publishing and financial reconciliation
- Owner/staff can control public menu prices, Bring-a-Friend prices, availability, food photos, and whether an item belongs to Today's Food or the everyday/deal menu.
- Today's Food is data-driven from `menu` items scheduled to specific weekdays. Keep the supplied weekly menu as a safe public fallback until the owner publishes daily items.
- Food photos are uploaded by authorized admin users to Firebase Storage under `boemoMedia/`; do not expose arbitrary storage writes.
- Orders preserve item/price snapshots. Payment collection is tracked separately from the sale: payment method, payment status, and amount actually recorded as received.
- Financials are a daily reconciliation view: expected order sales, recorded payments by method, outstanding amounts, actual cash/e-transfer/other received, and variances. This is not a profit-and-loss report because BOEMO does not yet record food costs or other expenses.
- Do not mark an order paid merely because it was submitted. The kitchen records payment when cash or an e-transfer is actually received.
