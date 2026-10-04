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

The public home and customer order page use the Firestore `menu` collection as the source of truth. The first authorized Kitchen load seeds the supplied starter menu into Firestore with stable IDs; owner/staff can then CRUD those same records. Do not reintroduce hard-coded menu/deal fallbacks. If no menu is published or the menu cannot be loaded, show the BOEMO phone fallback (76425849 / 76769834) rather than stale prices. Starter daily meals whose prices were not supplied remain unpublished until the owner enters the real price and makes them available. An online order failure must be surfaced as an online/Firebase error; do not mislabel an online write timeout as an offline save.

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
## Firebase Authentication deployment contract
- BOEMO's production Vercel hostname is `boemo-joos-food-deals.vercel.app` and must be present in Firebase Authentication → Settings → Authorized domains. Google sign-in cannot be repaired in application code when Firebase returns `auth/unauthorized-domain`; this is a live Firebase project setting.
- The Firebase project's default auth domain is `boemo-joos-food-deals.firebaseapp.com`. Keep that project identity in the deployed `NEXT_PUBLIC_FIREBASE_*` configuration.
- Google sign-in uses the existing Firebase popup flow. Guest users are upgraded with `linkWithPopup`, preserving the anonymous UID and its order/profile association; standalone Google sign-in creates a normal Firebase user.
- When troubleshooting `auth/unauthorized-domain`, verify the exact browser hostname, Firebase Authorized Domains, Google provider configuration, and deployed environment variables before changing application auth code.

## Firebase environment and build safety
- Firebase web configuration is public client configuration and must come from `NEXT_PUBLIC_FIREBASE_*` environment variables in deployed/runtime environments.
- The Firebase client contains non-secret build placeholders so CI can prerender client routes when those environment variables are intentionally absent. Those placeholders are not a Firebase project and must never be treated as runtime configuration.
- Before live Firebase testing, confirm the deployment has the real BOEMO Firebase environment variables for the relevant environment.
- Anonymous Authentication is enabled in the BOEMO Firebase project. Guest checkout should therefore create an anonymous Firebase user when the client is online and configured correctly; checkout must still retain its guest fallback if authentication cannot be established.

## Menu publishing and financial reconciliation
- Owner/staff can control public menu prices, Bring-a-Friend prices, availability, food photos, and whether an item belongs to Today's Food or the everyday/deal menu.
- Today's Food is data-driven from `menu` items scheduled to specific weekdays. The supplied weekly menu may be shown only as an informational guide when the owner has not published today's priced items; it must never become orderable, seed Firestore, override owner edits, or invent prices. Published Firestore menu items remain the source of truth.
- Food photos are uploaded by authorized admin users to Firebase Storage under `boemoMedia/`; do not expose arbitrary storage writes.
- Orders preserve item/price snapshots. Payment collection is tracked separately from the sale: payment method, payment status, and amount actually recorded as received.
- Financials are a daily reconciliation view: expected order sales, recorded payments by method, outstanding amounts, actual cash/e-transfer/other received, and variances. This is not a profit-and-loss report because BOEMO does not yet record food costs or other expenses.
- Do not mark an order paid merely because it was submitted. The kitchen records payment when cash or an e-transfer is actually received.



## Menu-entry UX checkpoint (September 2026)
- The public home separates `section: "daily"` + today's `days` from `section: "deal"` items. New kitchen menu entries default to Today's Food for the current Botswana day, rather than silently landing in Deals.
- Existing edits preserve their stored section/days. An item previously saved as a Deal must be edited and switched to Today's Food; code must not silently reinterpret an existing Deal as today's meal.
- New menu-entry defaults use Africa/Gaborone so the kitchen's current day matches the public customer's day.


## Legacy menu correction checkpoint (September 2026)
- A one-time authorized-kitchen migration converts legacy custom items that were saved by the old New Item form as `section: deal`, `category: Deal`, and an auto-generated ID into Today's Food for the current Africa/Gaborone day, but only when today's published daily section is empty.
- Starter deal records with stable `deal-` IDs are never migrated. The migration writes a marker so it cannot repeatedly reinterpret future menu edits.
- This protects the customer's existing starter deals while correcting the specific old-form mistake that put newly entered food under Deals.

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


## BOEMO commercial offer — September 2026
- Existing BOEMO monthly food-subscription offer: **P600 per month**, covering Monday through Sunday.
- Exact subscription entitlement, meal-selection rules, pickup/delivery treatment, payment/renewal workflow and cancellation rules are not yet defined in the app; do not invent them or advertise online subscription checkout until those rules are agreed and implemented.
- Primary contact for the subscription offer: **76425849**.


## Current-service menu placement correction (September 2026)
- Legacy custom menu entries created by the former kitchen form (`section: deal`, `category: Deal`, generated non-`deal-` IDs) may be treated as current service foods by the customer homepage/order form for compatibility with historical kitchen data.
- This is a compatibility presentation rule, not permission to rewrite Firestore records. Automatic legacy migration is disabled. Staff must deliberately reclassify a record in the admin when its stored section/day is wrong.
- Stable `deal-` starter records remain under Deals. Explicit daily records continue to obey their weekday schedule. A published `friendPrice` also makes an item eligible for the customer Deals presentation so an offer is not silently lost just because an older record was reclassified as daily.


## Deals and offers admin UX (September 2026)
- Menu & Prices keeps one existing workflow but provides explicit `+ Today's food` and `+ Deal / offer` actions so kitchen staff do not have to remember which section selector to use.
- The admin list is grouped into Today's Food and Deals & offers. Deal records can show an optional Bring-a-Friend price alongside the normal price.
- Deals remain ordinary `menu` records with `section: deal`; no separate collection or checkout workflow is introduced. This keeps the change small and preserves the existing Firestore model. Firestore supports updating existing document fields without replacing the document, which fits this model.


## Offline menu resilience checkpoint (October 2026)
- Customer Home and Order pages cache the last successfully fetched Firestore menu in browser localStorage and use it when Firestore is temporarily unreachable/offline.
- Firestore remains the source of truth; cache is only a resilience fallback and is refreshed after successful reads.


## Customer UX reliability checkpoint (October 2026)
- Deal cards explicitly show the admin-controlled regular price and Bring-a-Friend price when friendPrice exists; this is presentation only and never invents a friend price.
- Order confirmation stores a same-device order snapshot in browser localStorage as a private resilience fallback. It does not replace Firestore authorization or expose orders publicly.
- Order tracking uses the authenticated guest session for live Firestore access, while the same-device snapshot can prevent a confusing blank/error screen when that session is temporarily unavailable.
- The service-worker shell version is bumped when customer-facing code changes so installed PWAs can detect and activate the new shell.
- Google sign-in still requires the production Vercel hostname to be an authorized Firebase Authentication domain and Google to be enabled as a provider; this is a Firebase Console setting, not an application-code setting.


## Customer food-day / preorder UX (October 2026)
- When no Today's Food is published, the homepage should not dead-end. If a future Africa/Gaborone daily menu item is published, show a live countdown to that next food day and a direct pre-order CTA.
- Pre-ordering must use the same Firestore menu source of truth. The order screen accepts a future date and shows the daily items published for that weekday plus evergreen deals; it must never invent future food or prices.
- Guest checkout remains guest-friendly but uses Firebase Anonymous Auth under the hood so each order has an authenticated owner. This keeps Firestore order reads private while requiring no customer sign-in.
- Google sign-in controls retain Google branding; BOEMO styling belongs around the control, not inside the Google-branded action itself.
- Firebase Firestore rules must require a customerId tied to the authenticated guest/customer UID on order creation. Do not fall back to unauthenticated order creation.


## Account-holder loyalty and priority direction (October 2026)
- Google account connection is an optional upgrade from the anonymous guest identity. Firebase supports linking the credential to the existing anonymous user so the same BOEMO UID can retain the customer's profile/order association.
- A connected BOEMO account may become eligible for owner-controlled member benefits: occasional discounts, exclusive specials, early access, loyalty rewards, and priority handling of advance requests. Benefits are not automatic promises and may vary by offer, capacity, margin and kitchen decision.
- Priority handling can extend beyond ordinary food orders to larger advance requests and catering/event enquiries. This is a service priority, not a guarantee of availability or acceptance.
- Keep loyalty simple and useful. Current restaurant research supports exclusive offers, personalized rewards and early access, while also emphasizing that rewards should be easy to understand and worthwhile.
- Do not let the customer client calculate or self-award a discount. Any financial benefit must remain owner-controlled and be applied/recorded through the kitchen workflow so the browser cannot grant itself money off.
- Do not make Google connection or marketing notifications a prerequisite for ordering. Order-status communication and promotional/member communications are separate permissions. Browser push is still a later phase until Firebase Cloud Messaging infrastructure is implemented and tested.
- Account copy should explain the exchange clearly: connecting an account can preserve history and make the customer eligible for member-only/priority benefits; notification preferences should remain opt-in and understandable.

## Menu integrity checkpoint (October 2026)
- Automatic legacy menu migration has been disabled. A menu item saved as a Deal must never be silently moved into Today's Food based on the day the admin page happens to open.
- This matters for Bring-a-Friend offers: the homepage already renders `friendPrice` for published deal records, so a deal being reclassified as daily can make it disappear from Special Deals without the homepage renderer being the root cause.
- Existing Firestore records are not rewritten automatically. Any historical record that was already reclassified must be inspected and repaired deliberately from its stored data; do not infer its original section or day.


## Everyday conversion / utility checkpoint (October 2026)
- The homepage is a daily utility surface, not only a brochure: when today's food exists, it also shows the next published food day and a live Africa/Gaborone countdown with a direct order-ahead CTA.
- Countdown dates must be calculated from Africa/Gaborone calendar data, not the customer's device-local midnight, so Botswana users do not get a shifted weekday/date.
- The Deals section must surface explicit deal records and any published item with a `friendPrice`, because Bring-a-Friend pricing is itself a customer offer. Never invent a price.
- Bring-a-Friend pricing is now actionable in checkout: when a customer orders 2+ units of an item with `friendPrice`, checkout applies that lower per-person price and stores the applied unit price in the order. The customer must see that the offer is active.
- Keep guest ordering prominent. Customer research consistently finds forced account creation and hidden guest checkout create avoidable abandonment; BOEMO should preserve ordering without authentication while keeping optional My BOEMO/account benefits separate.
- Show important cost/offer information before submission. The customer should see regular price, offer price, and the resulting total rather than discovering the benefit only after ordering.
- Do not add notification permission prompts as a prerequisite for ordering. Notifications remain an opt-in engagement layer until Firebase Cloud Messaging is implemented and tested.
- Continue prioritizing practical repeat-use utility: today's menu, next food day, order-ahead, mobile-kitchen location/hours, scheduled pickup/delivery, order tracking, receipts, guest checkout and optional account history.


## Order-ahead selection reliability checkpoint (October 2026)
- Changing the scheduled date/time must never clear food the customer has already selected. Preserve the in-progress selection while the customer adjusts scheduling; do not make the customer rebuild a cart because a date/time field changed.
- The scheduled datetime minimum uses Africa/Gaborone time rather than the device's local timezone.
- The order page keeps a visible summary of selected food and applied prices so customers can confirm what will be submitted before Place order.
- Guest-first checkout, pickup/delivery, scheduled ordering, Bring-a-Friend pricing, account linking and tracking remain intact.


## No-menu preorder recovery checkpoint (October 2026)
- The customer Order page must not make an unpublished food day a dead end when a future daily menu is already published. Show the next published food day and a direct pre-order CTA inside the empty state.
- This recovery action must derive only from published Firestore daily records and Africa/Gaborone calendar dates. It must never invent future food, prices or availability.

## Pickup notification checkpoint (October 2026)
- BOEMO supports opt-in web push pickup reminders for both customers and authorized kitchen staff.
- The default reminder lead time is 15 minutes, with selectable 5, 10, 15, 20, 30, 45 or 60 minutes before scheduled pickup.
- Notification permission must be requested from an explicit user action; never pop the browser permission dialog on page load.
- Guest checkout remains intact. After a successful order, the same authenticated guest session is offered notification settings so a guest can enable pickup reminders without creating a Google account.
- Device registration tokens are stored privately under the authenticated user's notification token path. Firestore rules must never expose another user's tokens.
- Background delivery uses Firebase Cloud Messaging and the existing BOEMO service worker so notifications can arrive when the PWA is not open. FCM web push requires HTTPS and a Firebase Web Push/VAPID public key.
- Reminder scheduling is a Firebase Cloud Function using Cloud Scheduler, not Vercel Cron. This matters because the current Vercel Hobby plan does not provide minute-level Cron precision.
- The scheduled function targets pickup orders and sends to the customer plus opted-in admin devices at each recipient's chosen lead time. Delivery/collected/cancelled orders are not reminded.
- Firebase scheduled functions require the Firebase project to use the Blaze plan. The app code can be pushed independently, but production reminder delivery is not considered live until the scheduled function is deployed and the Firebase Web Push public key is configured.
