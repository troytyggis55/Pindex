## Secuirity & Auth

- [ ] **Proper Google sign-in** — [Google setup guide](https://claude.ai/share/1749529e-dcb5-4138-b923-18b4dca2980a) - Were not yet going to bother with google login yet.
- [ ] **Fix reset password** — The reset password flow is currently broken and hangs on "Verifying reset link…" 

- [X] **Storage bucket RLS** — Add row-level security policies to all three Supabase Storage buckets (`pin-images`, `org-logos`, `profile-images`): public read, authenticated write scoped to the owner or org admin.
    - [ ] **Fine tune Policies** — Go over all policies and make sure they're as wanted.

- [ ] **Full security audit** — End-to-end audit of database RLS policies, storage policies, API exposure, and auth flows. Check for insecure direct object references, missing ownership checks, and any unauthenticated data access.

## Features

- [ ] **New trade forwards to finished trade screen**

- [ ] **Filter pins by organization** — Filter the explore page to show only pins from a specific org.

- [ ] **User trading stats** — Show on a profile: total trades, total unique trading partners, most-traded-with person.

- [ ] **"Want to trade" matchmaking view** — Surface users who have a pin you want AND want a pin you have. Purely informational, to spark IRL trades.

- [ ] **Duplicate trade detection** — UX that spots when two users independently logged the same trade and offers to link/merge them.

- [ ] **Contact-to-user matching on signup** — When a new user signs up, run a name check against existing users' contact catalogs and notify those users to confirm if it's the same person.

- [ ] **In-app notification feed** — Trade confirmations, new followers, and contact-match alerts.
