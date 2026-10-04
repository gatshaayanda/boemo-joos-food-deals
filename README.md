# BOEMO Joos Food Deals

**BOEMO Joos Dealer — Good Food. Great Taste. Every Day!**

Mobile-first ordering and kitchen-operations PWA for a mobile kitchen serving around Botswana Accountancy College (BAC) and nearby student areas.

## Customer flow
Home → Today's Food / Deals → Order Ahead → Pickup or Delivery → Confirmation

Customers do not need an account to place an order.

## Current supplied menu
- Monday: Ke Starch, Beetroot, Pumpkin, Chicken + Stew, Soup, Drink of Choice
- Tuesday: Samp & Stew
- Wednesday: Pap, Braai, Chicken, Morogo
- Thursday: Dumplings & Chicken
- Friday: Hot Dog & Fries

## Current supplied deals
- Beggar & Chips: P30; Bring a Friend P25
- Hot Dog: P25; Bring a Friend P20
- Potatoes: P10
- Cup Drink: P8; Bring a Friend 2 for P15
- Still Water: P7; Bring a Friend 2 for P10
- Sausage & Chips: P30
- Combo Sausage + Chips + Drink: P40
- Beggar + Chips + Drink: P40

## Operations
/admin is protected by Firebase Authentication plus admins/{uid} with role owner/staff.

## Development
npm install
npm run dev

Quality gates:
npx tsc --noEmit
npm run lint
npm run build

See AGENTS.md for the implementation contract.

## Pickup notifications
Customer and kitchen pickup reminders are implemented with Firebase Cloud Messaging and a scheduled Firebase function. Before production delivery is enabled, generate a Firebase Web Push/VAPID key under Firebase Console → Project settings → Cloud Messaging → Web Push certificates and set `NEXT_PUBLIC_FIREBASE_VAPID_KEY` in the BOEMO deployment. Deploy the Firebase functions with `firebase deploy --only functions,firestore:indexes` on the BOEMO Firebase project; scheduled functions require the Firebase Blaze plan. The app asks for notification permission only from the user's explicit settings action and supports 5, 10, 15, 20, 30, 45 and 60 minute pickup reminders.
