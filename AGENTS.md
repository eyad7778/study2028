- Avoid rewriting published Git history with force pushes or amended/rebased commits.
- Keep the main branch in a working state after publishing changes.

- Login uses phone number mapped to a synthetic email (src/lib/auth.ts); never pass raw phone to auth — auth requires email.
- Paid content access is decided in the database by `has_access()` (active subscription + Telegram link, or staff); never gate only in UI.
- Subscription status changes happen server-side only; students have no UPDATE grant on subscriptions.
- The first account to sign up becomes `owner` (handle_new_user trigger); later accounts are `student`.
