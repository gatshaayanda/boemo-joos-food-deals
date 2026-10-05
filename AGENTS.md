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


## Pickup reminder scheduler checkpoint (October 2026)
- Production pickup reminders should use the native Firebase scheduled function in `functions/index.js`, backed by Cloud Scheduler, because real customer reminders need minute-level scheduling rather than a five-minute GitHub Actions approximation.
- The native function runs `sendPickupReminders` every minute in `Africa/Gaborone` and reuses `functions/pickup-reminder-runner.js`.
- Firebase documents `onSchedule` as the supported Cloud Scheduler integration for scheduled functions. Scheduled functions require the Firebase project to use the Blaze plan.
- The GitHub Actions workflow in `.github/workflows/pickup-reminders.yml` remains a fallback/manual verification path until the native Firebase scheduler is confirmed deployed. Do not remove the fallback until native production execution has been verified.
- The runner reads the existing `orders`, `notificationPreferences`, `notificationTokens` and `admins` collections and sends FCM web push through the existing service worker.
- Reminder lead times remain 5, 10, 15, 20, 30, 45 and 60 minutes. Cancelled, collected and delivered orders are skipped.
- Reminder delivery is idempotent through `notificationDeliveries`; scheduled invocations may overlap, so delivery claiming must prevent concurrent duplicate sends.
- Production reminders are not considered operational merely because code is pushed. They require a successful native scheduled-function deployment and an actual end-to-end test notification.
- The public Firebase Web Push/VAPID key remains client-side configuration and is not a secret.


## Customer order recovery checkpoint (October 2026)
- If a tracking lookup returns no live Firestore document but a same-device order snapshot exists, show that private snapshot instead of replacing it with an "order not found" dead end.
- The tracking page must distinguish a missing live record from a temporarily unavailable live read. Never discard a valid local customer recovery path.


## Account and tracking recovery checkpoint (October 2026)
- Firebase Auth production configuration has been verified: the Vercel hostname is authorized and Google + Anonymous providers are enabled. Do not show the old Firebase setup warning as the default account message.
- Google auth errors must be mapped to the actual Firebase error (cancelled popup, blocked popup, existing credential, already-linked provider, etc.).
- If an anonymous guest links Google from the order-tracking page, the tracking view must react to the auth-state change and immediately re-attempt the live order read/subscription for the same order.
- BOEMO order tracking stays private to the authenticated customer UID or authorized kitchen staff. Unlike a deliberately shareable Namane job link, BOEMO tracking links must not become publicly readable just for convenience.
- The same-device local order snapshot is a recovery layer, not an authorization bypass and not a substitute for live Firestore ownership checks.


### Customer dashboard + reminder checkpoint (October 2026)
- Public Home must provide a direct **My BOEMO** path; customers must not have to place an order before they can reach their account.
- My BOEMO is a customer dashboard/feed, not only a settings page: latest order, next scheduled food/pickup, tracking, and notification controls should be visible in the BOEMO context.
- BOEMO pickup reminders are independent scheduled notifications. They are based on the customer's scheduled pickup time and saved notification preference, not on an admin changing order status.
- The reminder runner uses a six-minute delivery window around each five-minute GitHub Actions run and runs on Africa/Gaborone time. Duplicate delivery records prevent repeat sends.
- Order tracking remains private to the authenticated customer UID/guest session; never turn BOEMO order URLs into public readable share links like Namane tracked jobs.


## Customer engagement and notification checkpoint (October 2026)
- My BOEMO is a customer dashboard, not a settings-only page. It includes a private live activity feed built from the customer's own orders, with totals, active/completed order moments, tracking links and a clear next action.
- The customer feed must never expose another customer's activity. Firestore `onSnapshot()` may stream only orders matching the authenticated customer's UID.
- Engagement should remain useful rather than gamified noise: order progress, completed-order history, upcoming action, pickup reminders and easy return-to-order are preferred over fake social activity, arbitrary points or invented rewards.
- Restaurant UX research supports order history, easy reordering/return paths, personalized offers and relevant push notifications as retention mechanisms; BOEMO must keep any financial reward owner-controlled and must not promise unimplemented loyalty benefits.
- BOEMO pickup reminder times are Africa/Gaborone times. New `scheduledFor` values are stored with an explicit `+02:00` offset. The free GitHub Actions reminder runner must parse legacy timezone-less values as Africa/Gaborone and query in Gaborone local-string space.
- Vercel limits are not the reminder scheduler: pickup reminders run through GitHub Actions → Firebase Admin/FCM. Do not diagnose a missed reminder as a Vercel limit without evidence.
- Push notifications require HTTPS, browser permission, a valid FCM web push registration/token and a service worker. Keep notification permission optional; ordering must never depend on it.


## Checkpoint: pickup reminder debugging
- Reminder runner is scheduled through GitHub Actions in Africa/Gaborone time.
- Runner logs the reminder matching window, candidate count, and final orders/reminders/sent summary for production debugging.
- Customer pickup notifications support both background service-worker display and foreground BOEMO handling.


## Save-state UX checkpoint (October 2026)
- Admin save confirmations must be visible at the point of action, not only as a message at the top of a long page. Use an immediate button/loading state plus persistent inline confirmation so staff can tell the save completed without scrolling.
- Successful settings/menu/reconciliation saves should leave the saved values visible in the current view. Error feedback must remain equally visible and must never imply a backend-confirmed save when the write failed.
- Pickup reminder parsing treats timezone-less legacy datetime-local order values as Africa/Gaborone; new scheduled orders already store an explicit +02:00 offset.


## Menu CRUD + food media UX direction — October 2026
- The BOEMO admin must have a first-class **Menu & Prices** CRUD workflow. The owner/staff should be able to create, view, edit, publish/unpublish, availability-toggle, and delete menu items without touching Firestore or code.
- CRUD fields must preserve the existing business model: item name, description where useful, price, optional Bring-a-Friend price, section (Today's Food vs Deal / offer), applicable weekday(s) for daily food, availability, and customer-facing media.
- Media is part of the menu-item content model, not a separate technical afterthought. The owner should be able to attach a food photo and, where useful, a short food video or lightweight animated asset. The implementation must not require the owner to understand filenames, storage paths, URLs, Firebase or code.
- **Preferred public media hierarchy:** use a strong food photo/thumbnail as the default visual; optionally provide a short muted/inline video preview when it genuinely helps show the food; support lightweight GIF/animated media only when it is materially useful and does not create unnecessary page weight. Do not make video/GIF mandatory for ordering.
- Public menu cards should remain fast to scan on a phone: food name, price/offer, availability state and a clear order action stay primary. Media should strengthen recognition and appetite appeal without pushing the ordering action below the fold.
- Tapping a food image/media should open a clear **item detail surface** (prefer a mobile-friendly modal/bottom sheet or dedicated item panel rather than navigating away from the menu) with a larger image/media view, description, pricing/offer information and the order action. The customer must have an obvious close/back path and must not lose an in-progress cart/order selection.
- Larger images should support normal mobile inspection, including pinch/double-tap zoom where appropriate. Do not force customers to guess that an image can be enlarged.
- Videos, if used publicly, should be short, muted by default, playsInline, and respectful of reduced-motion/data-saving preferences. Avoid autoplaying multiple heavy videos in a scrolling menu. A still thumbnail/poster remains the safe fallback.
- The admin media editor should show an immediate preview before save, make the current media obvious, provide replace/remove controls, validate supported file type/size, and make upload/save state unmistakable. Never imply that media is published until the storage write and menu-record update are actually confirmed.
- Store operational menu metadata in Firestore and heavy media objects in Firebase Cloud Storage. Menu documents should reference media metadata/URLs rather than embedding binary data. Firebase Storage rules must restrict writes to authorized owner/staff users and validate content type and size; public reads are appropriate only for media that is intentionally published on the public menu. Firebase documents Storage Rules as the mechanism for authenticated/role-based authorization and file-size/content-type validation.
- Media storage must be treated as a cost/performance concern. Prefer appropriately sized/compressed images, responsive delivery where practical, short videos, and lazy loading. Do not preload every menu video or download full-resolution media before the customer asks to inspect it.
- Public menu UX should follow food-delivery research rather than generic brochure design. Baymard's 2026 food-delivery benchmark specifically evaluates restaurant/menu list thumbnails, menu-item images, image zoom, descriptions, pricing/offers, add-to-order behavior and mobile ordering. Nielsen Norman Group's progressive-disclosure research supports keeping frequent/primary information visible while revealing secondary detail only when requested.
- Admin CRUD and public presentation should therefore be designed as one connected workflow:
  1. Owner creates/edits the menu item.
  2. Owner attaches or replaces food media and sees a local preview.
  3. Owner explicitly saves/publishes and receives visible confirmation.
  4. Public menu shows the item with a fast thumbnail/media treatment.
  5. Customer taps the item when they want more detail, sees the larger media/detail surface, and can order without losing their place/cart.
- Do not copy Admin Hub Global's visual style wholesale into BOEMO. The useful reference is its current **editorial media-row/project-card treatment with video previews**: BOEMO should borrow the principle of making real media a prominent, contained preview while keeping BOEMO's own mobile food-ordering hierarchy, branding and conversion path.
- Before implementation, inspect the current Admin Hub Global media presentation and the live BOEMO admin/public menu state again. Preserve working BOEMO ordering, offline behavior, published-menu source-of-truth rules, guest checkout and save-state UX.
- Relevant research references for future implementation:
  - Baymard Institute, Food Delivery & Takeout UX Benchmark 2026: https://baymard.com/research-articles/food-delivery-and-takeout-ux-benchmark-2026
  - Baymard Institute, Food Delivery & Takeout UX Research: https://baymard.com/research/online-food-delivery
  - Nielsen Norman Group, Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
  - Firebase Cloud Storage upload/security guidance: https://firebase.google.com/docs/storage/web/upload-files and https://firebase.google.com/docs/storage/security


## Browser push delivery architecture (October 2026)
- BOEMO browser push uses Firebase Cloud Messaging with server-side Firebase Admin SDK from the Next.js/Vercel runtime. It does not use Firebase Cloud Functions.
- Browser registration continues to store FCM tokens under `notificationTokens/{uid}/tokens/{encodedToken}`.
- `/api/notifications/test` authenticates the Firebase ID token and sends a test push through the server-side Admin SDK.
- `/api/notifications/reminders` is a protected server endpoint for the scheduled pickup-reminder runner.
- The 5-minute GitHub Actions workflow calls the production reminder endpoint with `BOEMO_REMINDER_CRON_SECRET`. This is the scheduling layer because Vercel Hobby Cron does not provide the required five-minute cadence.
- The Firebase Spark plan remains valid for this architecture: FCM is used for delivery, while no Firebase Cloud Functions deployment is required.
- The Firebase Admin service-account JSON must be stored as the Vercel environment variable `FIREBASE_ADMIN_KEY`; never commit it. The GitHub Actions scheduler only needs `BOEMO_REMINDER_CRON_SECRET`.
- Do not reintroduce Firebase Functions merely to restore push delivery. If notification delivery breaks, inspect the Next.js API route, Vercel environment variables, FCM token records, service worker, and GitHub Actions scheduler first.

<!-- Vercel build trigger: 2026-10-05 -->

<!-- Vercel build trigger: 2026-10-05-12-CHORE -->

<!-- Vercel verification trigger: 2026-10-05-2 -->

<!-- Vercel verification trigger: 2026-10-05-3 -->


## Pre-order planning link checkpoint (October 2026)
- Any public "Order ahead for <day>" planning CTA passes the target Africa/Gaborone calendar date into `/order?date=YYYY-MM-DD`.
- The order page must use that date as the selected menu day, so the daily food and evergreen deals shown in **Menu & deals** match the date the customer chose.
- The preselected date must not silently invent a pickup/order time. Date and time are separate mobile-friendly inputs; the customer chooses the time for the selected date.
- The scheduled order is stored as the selected Africa/Gaborone date + time with the existing explicit `+02:00` offset convention.
- Changing the scheduled date must update the menu day without clearing the customer's in-progress food selection.
- If a planning CTA is changed, preserve this date-to-menu linkage rather than hard-coding a weekday or relying on the device's local timezone.
