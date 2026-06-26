# The Employee Playbook — clean repo

This is a cleaned static/Vercel rebuild of the uploaded project. The old standalone page code has been reduced into:

- one shared CSS file: `assets/css/app.css`
- one shared layout/header/footer: `assets/js/layout.js`
- one shared Supabase client: `assets/js/supabaseClient.js`
- one shared auth flow: `assets/js/auth.js`
- one shared checkout flow: `assets/js/checkout.js`
- one shared tool save/playbook layer: `assets/js/toolState.js`
- production API routes in `api/`
- repeatable Supabase schema in `supabase/migrations/001_core_schema.sql`

## What changed

- Removed page-level duplicated headers, footers, CSS blocks, light/dark theme code, modals and old scripts.
- Every HTML page now loads the same shared assets.
- Tool pages are marked with `data-page="tool"` and get generic save, print and My Playbook buttons automatically.
- Protected pages are marked with `data-protected="true"`.
- Secrets and `.env.local` are not included.
- `_TEMP_UNTRACKED` is not included.
- Stripe webhook was rewritten with raw-body handling and no TypeScript syntax inside `.js`.
- `api/coach.js` is now an actual server route rather than prompt text.

## Visual system

This repo now uses one fixed premium visual system only: deep navy, electric blue, cyan, white and soft blue. There is no light/dark mode toggle, no theme localStorage, and no duplicated theme CSS.

## Before deploying

1. Fill `assets/js/config.js` with the public Supabase URL and anon key.
2. Add real environment variables in Vercel using `.env.example` as the checklist.
3. Run `supabase/migrations/001_core_schema.sql` in Supabase.
4. Add Stripe price IDs and webhook endpoint.
5. Run `npm install` then `npm run check`.
6. Test sign up, sign in, checkout, Stripe webhook, profile save, tool save and My Playbook save.

## Important note

This clean repo keeps the page content from the current project but replaces page-level JavaScript with shared behaviour. Some highly custom old interactions may need to be rebuilt intentionally as small modules rather than copied back into every page.
