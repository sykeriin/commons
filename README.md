# Commons

A campus app for students, faculty, staff, department heads and administrators: classes, departments, clubs, events, people and campus administration, with access that depends on your role. Built once in React and shipped to the web, Android and iOS (via Capacitor).

> **Status:** the web app and the demo mode are tested. The Firebase backend is tested against the Firestore emulator. The Android and iOS projects are generated and sync, but **have not been built or run on a device** (that needs the Android SDK / Xcode, which weren't available while developing). See [Native apps](#native-apps-android--ios).

## What's in it

| Area | Students | Faculty / professors | Staff & admins |
|---|---|---|---|
| **Today** | Next class, due work, events, announcements | Same, for sections you teach | Approval queue |
| **Academics / Teaching** | Timetable, catalog with seats, waitlist and clash detection, grades, attendance, assignments | Roster, attendance, grading, assignments, course announcements, office hours | |
| **Departments & people** | Directory, department pages, book office hours | Same, plus department news (heads) | Manage users, roles, departments, courses |
| **Clubs** | Discover, join or request, start a club | Advise clubs | Approve new clubs |
| **Events** | RSVP, waitlist, QR ticket | Create department events | Approve campus-wide events, check-in |
| **Manage** | | Dept heads: own department's courses and news | Approvals, role requests, users, announcements, stats, audit log |

### Roles and permissions

`student` · `faculty` · `dept_head` · `staff` · `admin`, plus per-club roles `member` · `officer` · `president` · `advisor`.

- Everyone starts as a student. Faculty/staff access is **requested** in *Me* and approved by an administrator. Roles are never self-assigned.
- The rules live in one place, [`src/lib/permissions.ts`](src/lib/permissions.ts). Every mutating action re-checks them in the store (not just hidden in the UI), and [`firestore.rules`](firestore.rules) enforces the same on the server.
- Grades, attendance and scores are visible only to the student, the section's instructor and administrators.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

With the placeholder Firebase config the app runs in **demo mode**: pick a persona (student, professor/department head, faculty, staff, admin) on the landing page, or switch from the avatar menu. Data is sample data in your browser's localStorage and resets daily so dates stay relevant.

## Real accounts (Firebase)

1. Create a Firebase project with **Authentication → Google** and **Firestore**.
2. Put your web app config in `firebase-applet-config.json`.
3. Deploy the rules: `npx firebase-tools deploy --only firestore:rules`.
4. Set `BOOTSTRAP_ADMIN_EMAIL` in [`src/lib/config.ts`](src/lib/config.ts) **and** `bootstrapAdmin()` in `firestore.rules` to your Google account. The first sign-in from that verified email becomes the administrator. Everyone else starts as a student.
5. Sign in as that admin and use **Manage → Import sample campus** on an empty project, or enter your own data.

### Cloud Functions (required for real accounts)

Seat limits and notifications need server code, because Firestore rules cannot count documents. The `functions/` package provides it:

- **`enroll`, `drop`, `rsvp`, `cancelRsvp`** count seats and move people off the waitlist inside a transaction, so a full course or event cannot be oversold however many requests arrive at once. The rules forbid clients from writing enrolments or RSVPs directly, so the app has no other path.
- **Firestore triggers** create notifications (grades, assignments, join requests, club/event/role decisions, waitlist promotions). Clients can only mark their own as read.
- **`onNoticePush`** sends each notification to the recipient's registered devices through FCM and removes tokens FCM reports as dead.

```bash
npm --prefix functions install
cp functions/.env.example functions/.env      # set FIRESTORE_DATABASE_ID only if you use a named database
npx firebase-tools deploy --only functions,firestore:rules
```

Requirements and limits:

- Deploying functions needs the Firebase **Blaze (pay-as-you-go)** plan. **Until they are deployed, enrolling and RSVPing do not work against a real project** (demo mode is unaffected).
- Under heavy contention a transaction retries up to 30 times, so a burst of thousands of students hitting one section at the same instant could see some requests fail with `aborted`; the app reports it and they can retry.
- The Firestore triggers, the callable wrappers and a real FCM delivery have **not been run**: no deployed project or emulator for functions was available here. The handlers they call, the notice builders and the push sender are tested (see below), and the thin wrappers in `functions/src/index.ts` are type-checked only.
- Role changes are picked up live for the user's private-data queries. Web push is not implemented.

## Tests

```bash
npm run lint        # type-check
npm test            # needs Java; starts the Firestore emulator
```

`npm test` runs, against the Firestore emulator: 104 security-rule tests; 27 integration tests that drive the real `FirebaseStore` as each role against the real rules and server handlers; and 16 tests of the server handlers themselves, including races (40 simultaneous enrolments into 10 seats must end with exactly 10 enrolled; the same suite run against a non-transactional implementation fails).

```bash
npm run test:e2e    # browser tests; starts its own dev server, needs Chromium (npx playwright install chromium)
```

`test:e2e` drives the real app as each role: every route on phone and desktop with no console errors, nine behaviour flows (enrol, waitlist, approvals, role gating), a phone-width overflow audit across every tab in both themes, and WCAG contrast checks for the dark theme. Playwright is pinned to an exact version so it matches the installed browser build.

## Native apps (Android & iOS)

```bash
npm run build:mobile      # relative-path build for the WebView
npx cap sync              # copy web build + plugins into android/ and ios/
npm run android           # opens Android Studio  (needs Android SDK + JDK 17+)
npm run ios               # opens Xcode           (needs macOS + Xcode)
```

Before shipping:

- **Push notifications** use `@capacitor-firebase/messaging` (`src/lib/push.ts`). Besides the config files below you must upload an APNs key in the Firebase console, enable the Push Notifications capability in Xcode, and add the AppDelegate forwarding code from [the plugin's iOS setup](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/messaging#ios). I did not add that Swift code because I could not compile it here. *Token registration and tap-to-open are written but unverified on a device.*
- **Google sign-in** in the native app uses `@capacitor-firebase/authentication`. Add `google-services.json` to `android/app/` and `GoogleService-Info.plist` to `ios/App/App/` (from the Firebase console) and register your SHA-1 / URL scheme. *This path is written but unverified on a device.* Demo mode needs none of this.
- Replace the default launcher icon and splash (`@capacitor/assets` can generate them).
- App id is `app.commons.campus` in [`capacitor.config.ts`](capacitor.config.ts). Change it to your own reverse-DNS id.
- App Store / Play Store signing, listings and privacy policy (the in-app Privacy page is a placeholder) are on you.

## Project layout

```
src/app/        session, router shell, role-aware navigation
src/pages/      screens (Academics, Teaching, Clubs, Events, Manage, …)
src/ui/         design-system components (Button, Card, Sheet, Toast, …)
src/data/       types, selectors, DemoStore, FirebaseStore, seed data
src/lib/        permissions, dates, firebase init, native bridge, push
functions/      Cloud Functions: seat/waitlist transactions, notification triggers, push
tests/firebase/ rules + integration tests
android/ ios/   Capacitor native projects
```

The visual direction (refined neo-brutalism: hard shadows on hero/accent elements, calmer data screens, light/dark) comes from the reference exports in [`stitch_discovery_feed/`](./stitch_discovery_feed).
