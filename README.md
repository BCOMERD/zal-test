# Zal team-test integration

Adds shared email accounts, customer orders, test restaurant onboarding/menu management, driver deliveries, private test-wallet accounting, and scoped AI support to the existing app and website design.

**Deployment status:** implementation tested locally. Database migrations, live auth/email delivery, Groq secret, Edge deployment and production end-to-end verification remain required. Do not describe this branch as a deployed working service until those steps pass.

## Deployment order

1. Back up the current Supabase schema. Run `supabase/preflight.sql` read-only and check restaurant/menu required columns and current policies against the migration. The local test fixture is not a dump of the production schema.
2. Run `supabase/team-test.sql` in the existing Zal project. It is transactional and repeatable; it adds test workflow data alongside the existing directory. Existing `profiles`, `drivers`, `wallets`, `transactions`, and legacy order data are preserved. Only orders explicitly marked `is_test` can be changed by the new workflow.
3. Run `supabase/ai-quota.sql`.
4. In Authentication URL configuration, allow `https://bcomerd.github.io/zal-test/app.html` for signup confirmation and password recovery. Check SMTP and test delivery to an external email address. Email confirmation stays enabled; the UI does not pretend that signup without a session is an authenticated login.
5. Set `GROQ_API_KEY` as an Edge secret. Do not put it in browser files, chat, Git, or SQL. Optional `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`; availability and account quota need live confirmation.
6. Deploy `zal-ai` from `supabase/functions/zal-ai/index.ts` with the supplied function config. Gateway JWT verification is replaced by explicit `/auth/v1/user` validation inside the function before any AI call. It rejects missing/invalid sessions, restricts browser origins, and applies per-user quotas of 12/minute and 200/day. Keep both SQL quota and function deployment together.
7. Only after backend checks pass, merge the frontend branch to `main` for the existing GitHub Pages deployment.
8. Run the real three-account acceptance test below. Local mocked authentication does not prove delivery of confirmation email or live sessions.

If an authenticated Supabase CLI is available:

```sh
npx supabase functions deploy zal-ai --project-ref lhvnhmkhnwxwadpqabsd --no-verify-jwt
```

Verify deployment by signing in and asking a question. An absent API key returns a clear 503; it never produces a canned AI answer.

## Verification

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:ui
```

On macOS with Chrome already installed:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:ui
```

The UI suite uses isolated browser contexts, local PGlite, and mocked authentication/AI. No real accounts, emails, payments or AI credits are used. It tests both existing HTML designs, mobile layout, sessions, restaurant creation, menu, customer checkout, restaurant acceptance, driver completion and ledger effects. The SQL suite additionally tests access control, idempotency, refunds, payout conservation and quotas. The AI suite tests request validation, authentication, restaurant scoping, credentials isolation and provider failures.

## Live acceptance test

- Restaurant account: create a test restaurant, add a €10 dish, verify it appears under Test restaurants.
- Customer account in another browser/device: create and confirm account; log in, order two dishes with €3 delivery and €2 tip, then simulate payment.
- Restaurant: receive the order, Accept and mark Ready.
- Driver account: register, Claim, mark Picked up, then Complete.
- Customer: see Completed/Delivered. Status polling is every 15 seconds; this is not GPS tracking.
- Wallet: restaurant €18.40, driver €5.00. Server accounting also records platform €1.40 and simulated gateway €0.20. Total €25.00; no money moved.
- Repeat a payment/completion request: no duplicated ledger entries. Cancel another pending paid order: its payment entries reverse exactly once.
- Sign out and sign back in; refresh the page. Orders and role ownership should persist. Verify another user cannot see or modify those records.
- Ask the restaurant AI about that dish in Arabic, English and French. Check it stays within the selected restaurant and reports missing facts as unknown.
- Test signup confirmation, resend and password recovery with email outside the Supabase organization before sharing with the team.

## Boundaries

- All payments and wallet balances in this integration are simulations; no banking integration or cash-out.
- Directory restaurants have not joined the test. Orders to those entries do not notify real businesses. Use restaurants registered by the team for the full acceptance/delivery cycle.
- Legacy family/corporate wallet and group-payment design mockups are not implemented payment products. Entry links now point to the actual test wallet. Voice/call mock buttons open text AI instead of faking recorded conversations.
- AI is retrieval-grounded but generated answers still require checking against listed menu facts; do not promise perfect factual accuracy or allergen safety.
- No secret keys or Supabase access tokens are included in this repository.
