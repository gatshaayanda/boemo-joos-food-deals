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

The customer order page may use Firestore `menu` data when available, with the supplied static BOEMO deals as the safe fallback. An online order failure must be surfaced as an online/Firebase error; do not mislabel an online write timeout as an offline save.

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


## Current operating architecture (September 2026)
- The kitchen queue is realtime: authorized admin clients subscribe to Firestore orders, menu and business settings rather than relying on manual refresh alone. Manual Refresh remains a recovery/control action.
- Firestore persistent local cache uses the multi-tab cache. Firebase documents that queued writes synchronize when connectivity returns; the UI must distinguish a local/offline save from a write confirmed by the backend.
- The customer order flow remains guest-first. Anonymous Firebase Auth is a convenience for profile/order association, not a prerequisite for buying.
- The PWA service worker caches the public app shell plus /account and /admin. Private Firestore data is not copied into the service-worker cache; Firebase's own Firestore persistence handles authenticated/offline data.
- Firebase Storage admin access must recognize the same owner/staff roles as Firestore, including the currently used capitalized Owner/Staff values.
- Food photos are public-read and admin-write under boemoMedia/, with image-only uploads and a 12 MB per-file limit.
- Browser push notifications are a later phase. Firebase Cloud Messaging for Web requires HTTPS, notification permission and a service-worker/token setup; do not promise push notifications until that infrastructure is implemented and tested.

## Security and data integrity guardrails
- Firestore rules are part of the source-of-truth repository, but changing firestore.rules or storage.rules in GitHub does not by itself deploy them to Firebase. Treat Firebase Rules deployment as a separate checkpoint and verify the live Rules tab after deployment.
- Never make /orders/{id} publicly readable merely to make a tracking link convenient. Current order reads require the attached customer UID or authorized admin access.
- Never expose customer profiles publicly.
- Client-side order totals/prices are convenience data and must not be treated as payment proof. If BOEMO later accepts online payments, introduce server-side/payment-provider verification rather than trusting browser fields.
- Do not silently turn Firestore permission errors into "offline mode." Offline authorization is only appropriate for an already-authorized cached admin session; permission/configuration failures must remain visible.
- Storage uploads require connectivity even though Firestore data can queue offline. The UI should not describe an unuploaded photo as published.

## Current product maturity
BOEMO is now a working small-business operations PWA foundation:
1. public mobile storefront and weekly menu fallback;
2. admin-controlled Today's Food, everyday/deal prices, Bring-a-Friend pricing, availability and food photos;
3. mobile-kitchen location and serving-hours publishing;
4. guest-first scheduled pickup/delivery orders;
5. customer account/profile and same-account order history;
6. live order tracking for authenticated/associated orders;
7. PDF receipts and printing;
8. realtime kitchen queue and order status/payment recording;
9. daily cash/e-transfer/other reconciliation;
10. installable/offline shell and Firestore offline persistence.

The next work should deepen reliability and business operations rather than add unrelated features.
