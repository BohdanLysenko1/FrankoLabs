# Verify franko-os changes

How to drive this app end-to-end for verification.

## Launch

```bash
npm run dev -- --port 3457   # from franko-os/; ready in ~5s, first page compile ~5-15s
```

Drive with Playwright using system Chrome (no browser download needed):

```js
const { chromium } = require("playwright"); // npm i playwright in a scratch dir
const browser = await chromium.launch({ channel: "chrome", headless: true });
```

## Gotchas that will eat your timeout

- **First visit to any `(site)` page pops the "Appearance" theme dialog**
  after a beat, covering everything. Dismiss by *choosing a theme* (persists
  `firstRun=false`); Escape only hides it until the next full page load:
  ```js
  const dlg = page.getByRole("dialog", { name: "Choose your theme" });
  await dlg.waitFor({ timeout: 8000 });
  await dlg.getByText("Dark", { exact: true }).click();
  ```
- **The site MenuBar duplicates button names** ("Sign in", "Sign out") —
  scope to `page.locator("form")` or the content area, or strict mode fails.
- **AnimatePresence transitions**: after switching forms (e.g. OwnerLock
  recovery → sign-in), the exiting form is still in the DOM for ~200ms.
  Use exact placeholders (`getByPlaceholder("Password", { exact: true })`).
- `window.confirm` guards destructive actions (reset workspace, reset client
  access) — register `page.on("dialog", d => d.accept())`.
- `?noonboard=1` boots an ephemeral seeded workspace that never touches
  localStorage — use it to bypass onboarding AND the owner lock.

## State model (what to assert against)

- CRM state: `localStorage["franko-crm-state-v2"]` (shared by /crm and the
  (site) portal — same origin, same store).
- Credentials: `localStorage["franko-accounts-v1"]` (owner + client password
  hashes; survives "Restore sample data").
- Sessions: `franko-owner-session` (gates /crm), `franko-portal-session`
  (client desktop at /).

## Flows worth driving

Onboarding (workspace → owner account → pipeline → sample data → one-time
recovery code), owner sign-out/sign-in at /crm, recovery-code password reset
(old code must die), client invite `/login?invite=<companyId>` set-password
activation, wrong-password rejections, CRM portal view Active/Invited chips +
Reset access, Settings → Data & backup export/import round-trip.

A full working script for all of this: see the session scratchpad `e2e.js`
pattern (27 steps) — rebuild from the flows above if it's gone.
