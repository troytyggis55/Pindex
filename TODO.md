## Security

- [X] **Storage bucket RLS** — Add row-level security policies to all three Supabase Storage buckets (`pin-images`, `org-logos`, `profile-images`): public read, authenticated write scoped to the owner or org admin.
    - [ ] **Fine tune Policies** — Go over all policies and make sure they're as wanted.

- [ ] **Full security audit** — End-to-end audit of database RLS policies, storage policies, API exposure, and auth flows. Check for insecure direct object references, missing ownership checks, and any unauthenticated data access.

## Admin / Org management

- [x] **Admin user page** — A user can be an admin for several organizations. These organizations should be shown as a list on the profile page. Clicking an element opens the admin page for that organization, where the user can change everything about the organization, add pins, and transfer admin to a new user.

- [x] **Pin image upload** — Org admins can upload a photo of the physical pin when creating or editing it.

## Discovery & browsing

- [ ] **Filter pins by organization** — Filter the explore page to show only pins from a specific org.

## Social

- [ ] **User trading stats** — Show on a profile: total trades, total unique trading partners, most-traded-with person.

- [ ] **"Want to trade" matchmaking view** — Surface users who have a pin you want AND want a pin you have. Purely informational, to spark IRL trades.

## Trade flows

- [ ] **Duplicate trade detection** — UX that spots when two users independently logged the same trade and offers to link/merge them.

- [ ] **Contact-to-user matching on signup** — When a new user signs up, run a name check against existing users' contact catalogs and notify those users to confirm if it's the same person.

## Notifications

- [ ] **In-app notification feed** — Trade confirmations, new followers, and contact-match alerts.
