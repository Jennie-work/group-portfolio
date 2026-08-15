# FORM/24 Group Portfolio

A responsive bilingual group portfolio built with Next.js, TypeScript, Tailwind CSS, and Supabase.

The project is production-ready after Stage 9 preparation. Authenticated owners manage only their own works and files; public visitors see safe profile fields, published works, and short-lived signed document links. Admin tools, collaborative editing, custom domains, and visual redesign remain out of scope.

## Run locally

```bash
npm install
npm run lint
npx tsc --noEmit
npm run dev
```

Open `http://localhost:3000` (or the next available port shown in the terminal).

Create `.env.local` before running the app:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use `.env.example` as the credential-free template. Never commit `.env.local`, a Supabase `service_role` key, or any other secret.

## Routes

- `/` — public home page
- `/members` and `/members/[slug]` — public Supabase member profiles and published personal work
- `/group-works` — published Supabase group works
- `/group-works/[id]` — compatibility redirect to the canonical work route
- `/works/[id]` — published work details, owner/contributors, and file actions
- `/login` — pre-approved member login
- `/dashboard` — protected owned-work management
- `/dashboard/works/new` — create metadata and upload files
- `/dashboard/works/[id]/edit` — replace files or edit an owned work
- `/api/works/[id]/file` — creates a 60-second signed URL for an allowed private document

## Supabase setup

1. Add the project URL and publishable key to `.env.local`. Never add a secret or `service_role` key to a browser environment variable.
2. Run the migrations in order in Supabase **SQL Editor**:
   - `20260815000000_stage2_foundation.sql`
   - `20260815010000_stage3_auth_policies.sql`
   - `20260815020000_stage4_work_management.sql`
   - `20260815030000_stage5_storage_uploads.sql`
   - `20260816000000_stage6_public_data_contributors.sql`
   - `20260816010000_stage7_security_audit.sql`
3. Keep the existing pre-approved Auth user and matching `profiles` row.

### Approved member accounts

Public registration is not part of this project. Create approved members manually in **Supabase Dashboard → Authentication → Users → Add user**, then create a matching `public.profiles` row with the same Auth UUID as `profiles.id`. Each member needs a unique email, name, slug, and role. A member can log in only after both records exist.

### Production Auth URLs

After Vercel provides the initial production URL, set these values in **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://your-production-domain.vercel.app`
- **Redirect URLs:** add `https://your-production-domain.vercel.app/**` and retain `http://localhost:3000/**` for local development.

This application uses email/password login and does not need browser-visible secret keys. Keep public sign-up disabled and continue creating approved accounts manually.

The Stage 7 migration hardens:

- Database constraints for safe `http`/`https` links and bounded public text fields.
- Anonymous profile access so public routes can use only the email-free `public_profiles` view.
- Canonical, owner-bound Storage upload, replacement, and deletion paths.
- Operation-aware Storage reads: owners can perform required single-file actions without gaining folder listing, while visitors may sign only files attached to published works.
- Published-file checks used by 60-second signed URLs; draft files cannot be signed publicly.

The Stage 6 migration adds:

- Bilingual role, bio, and skills fields to `profiles`, while retaining the original fields as fallbacks.
- A public `public_profiles` view that intentionally omits private email addresses.
- Public contributor reads only for published works.
- Owner-only contributor insert, update, and delete policies.
- An atomic `sync_work_contributors` function used when a group work is saved.
- Contributor read access to works they participate in, without giving contributors edit or delete permission.

The existing Stage 5 migration configures:

- `covers` — public; JPG/JPEG, PNG, or WebP; bucket maximum 10 MB.
- `works` — private; PDF, PPT, or PPTX; bucket maximum 100 MB.
- Owner-folder Storage policies for upload, replacement, and deletion (further restricted by Stage 7).
- Public access to private documents only through paths referenced by published works and the signed URL flow.
- Public read access to published work metadata.

The application additionally enforces per-file limits: cover 10 MB, PDF 50 MB, PPT/PPTX 100 MB, and preview PDF 50 MB. Supabase also enforces the cover bucket at 10 MB and the private works bucket at 100 MB.

## Storage paths

Database fields store stable object paths, not expiring URLs:

```text
covers bucket: {user-id}/{work-id}/cover.ext
works bucket:  {user-id}/{work-id}/document.pdf
works bucket:  {user-id}/{work-id}/presentation.pptx
works bucket:  {user-id}/{work-id}/preview.pdf
```

`cover_url` stores the cover object path. `file_url` stores the PDF or original presentation path. `preview_url` stores the optional presentation PDF path. Public cover URLs are generated from the public bucket; private document URLs are signed on demand and expire after 60 seconds.

## Upload flow

For a new work, the dashboard first creates a safe database record, obtains its UUID, uploads files into that work folder, then updates `cover_url`, `file_url`, `preview_url`, and the requested publish status. On failure it attempts to remove new objects and the incomplete record.

When editing, no selected replacement means the current file is preserved. Successfully replaced or no-longer-relevant owned objects are cleaned up. Deleting a work removes its known owned Storage objects before deleting the database row.

## Contributor flow

The work creator remains `owner_id`. When a group work is saved, the dashboard atomically replaces that work's `work_contributors` rows with the selected existing profiles and roles. Duplicate profile relationships are removed. Changing the work back to personal sends an empty contributor list, which safely removes its relationships. Contributors may read the work but cannot update or delete it.

## GitHub and Vercel deployment

1. Create a **private** GitHub repository and push this project. The repository must include `supabase/migrations/`, `.env.example`, and `README.md`; it must not include `.env.local`, `.next`, `.vercel`, or `node_modules`.
2. In Vercel, import the GitHub repository. Framework detection should select **Next.js**. No output-directory override is required.
3. Add these environment variables in Vercel for **Production**, **Preview**, and **Development** as appropriate:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   ```

   Copy the values from the Supabase project’s **Settings → API** page. Use the publishable key only; never add a secret or `service_role` key.
4. Keep the default build command, `npm run build`; this project intentionally runs `next build --webpack` through that script for a stable Next.js 16 production build.
5. Deploy using Vercel’s initial `*.vercel.app` domain. Then update Supabase Auth Site URL and Redirect URLs as described above.
6. Smoke-test the deployed URL: public routes, language persistence, approved-member login/logout, dashboard access protection, metadata writes, Storage uploads, public PDF/PPT actions, and draft privacy.

Run the release checks locally before every deployment:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

## Not included

- Admin UI
- Collaborative contributor editing
- Custom domain configuration
- Visual redesign
