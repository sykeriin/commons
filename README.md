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

### Known limits (need Cloud Functions to close)

- Event and course **capacity / waitlist** are enforced by the client; Firestore rules can't count documents, so two people racing for the last seat can both get it.
- Any signed-in user can write a notification for another user (size-limited).
- Push notifications aren't implemented (needs FCM/APNs keys).

## Tests

```bash
npm run lint        # type-check
npm test            # needs Java; starts the Firestore emulator
```

`npm test` runs 96 security-rule tests and 24 integration tests that drive the real `FirebaseStore` as each role against the real rules.

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
src/lib/        permissions, dates, firebase init, native bridge
tests/firebase/ rules + integration tests
android/ ios/   Capacitor native projects
```

The visual direction (refined neo-brutalism: hard shadows on hero/accent elements, calmer data screens, light/dark) comes from the reference exports in [`stitch_discovery_feed/`](./stitch_discovery_feed).
