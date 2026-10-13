<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Login uses phone number mapped to a synthetic email (src/lib/auth.ts); never pass raw phone to auth — auth requires email.
- Paid content access is decided in the database by `has_access()` (active subscription + Telegram link, or staff); never gate only in UI.
- Subscription status changes happen server-side only; students have no UPDATE grant on subscriptions.
- The first account to sign up becomes `owner` (handle_new_user trigger); later accounts are `student`.
