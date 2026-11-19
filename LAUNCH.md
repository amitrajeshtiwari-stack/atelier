# Go-live checklist

Ordered, and step 1 is the one to do **before** the site is reachable at a
public URL. Everything else is reversible; that one is not.

---

## 1. Make this repository private

**Do this first — before DNS, before the deploy, before AdSense.**

`scripts/ingest-gazette.mjs` holds the whole method: the `SOURCES` list we
read, the extraction rules for dates and fees, the official-link filter, and
the brief composition. `.github/workflows/gazette-ingest.yml` shows the
schedule. A deployed site plus a public repo means anyone curious enough can
read exactly how the plate gets filled — and, more to the point, copy it.

**How:**

```bash
gh repo edit --visibility private --accept-visibility-change-consequences
```

Or: repository **Settings → General → Danger Zone → Change visibility**.

**Afterwards, check these:**

- The daily Action still runs. Repository secrets are repo-scoped and are
  unaffected by a visibility change — but confirm with one manual dispatch,
  because a silent `DATABASE_URL` failure is easy to miss.
- Free-plan private repos include 2,000 Actions minutes per month. The daily
  filing job takes well under a minute, so the budget is not a concern.
- If anyone has forked the repo, GitHub will **detach** the fork rather than
  delete it. That content stays public under their account.

**Be honest about what this does and does not do.** It stops future exposure.
It does not recall copies already cloned, forked, or cached. The good news,
verified in history before this checklist was written: no credentials were
ever committed — `.env*` has never been tracked, and the only
`pooler.supabase.com` string in the log is the placeholder format in the
README. So the exposure here is the *method*, not any secret.

---

## 2. Buy the domain and point it at the host

The domain is what actually blocks AdSense — a review cannot be run against
localhost, and canonicals pointing at `localhost:3000` index nothing.

---

## 3. Deploy, with the region set to Mumbai

Vercel Hobby is enough, and set the project region to `bom1` (Mumbai). The
audience is overwhelmingly mobile data in tier-2 and tier-3 cities; that one
setting matters more than the hosting brand.

Set these in the host's environment settings, not in the repo:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain` — no trailing slash |
| `NEXT_PUBLIC_CONTACT_EMAIL` | a real, working inbox. `hello@gazette.example` is a placeholder and reviewers check it. |
| `DATABASE_URL` | Supabase pooler URI (IPv4 `aws-0-…pooler.supabase.com`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from the Supabase dashboard |

---

## 4. Verify the public surfaces show the real domain

```bash
curl -s https://your-domain/sitemap.xml | grep -c "<url>"   # expect 33
curl -s https://your-domain/robots.txt                      # Sitemap: must not say localhost
curl -s https://your-domain/ | grep -o 'rel="canonical"[^>]*'
```

If any of these still say `localhost`, `NEXT_PUBLIC_SITE_URL` did not reach the
build. Fix and redeploy before submitting anything to Google.

Then, in order:

- **Google Search Console** — verify the domain, submit `sitemap.xml`.
- **Bing Webmaster Tools** — same; it feeds DuckDuckGo too.

---

## 5. AdSense

1. Apply. The trust pages, guides, composed briefs and canonical URLs are the
   substance a reviewer is looking for.
2. Once an account exists, configure a **certified CMP** in
   *AdSense → Privacy & messaging*. A hand-rolled cookie banner does not
   satisfy Google's EEA/UK requirement.
3. Publish `ads.txt` at the domain root with the `pub-…` ID from the account.
4. Do not add ad units to the notice pages until approval; and keep them out
   of the way of the **Join now** button — that button is the reason people
   come, and burying it is the fastest way to lose them.

---

## 7. Keep a copy that survives this laptop

```bash
node scripts/backup.mjs                  # → backups/gazette-<timestamp>.tar.gz
node scripts/backup.mjs --dir ~/somewhere
```

One archive, everything needed to stand the site back up on a machine that has
never seen this project:

| Inside | Why |
| --- | --- |
| `site/gazette.bundle` | full git history, every branch — `git clone` from it |
| `site/site.tar.gz` | the tracked files at HEAD |
| `db/gazette-data.sql` | every row, restorable |
| `db/gazette-snapshot.json` | the same rows plus policies, indexes, constraints |
| `env/.env.local` | the secrets — omitted with `--no-secrets` |
| `RESTORE.md` | the procedure, written out |
| `MANIFEST.txt` | commit, row counts, sha256 of every artifact |

The script verifies before it reports success: `git bundle verify` on the
bundle, and the tarball listed back off disk. Restoring is five steps —
clone the bundle, copy the env, apply `schema.sql` then `gazette.sql` then the
data file, `npm ci && npm run build`, redeploy.

**This has been rehearsed.** A snapshot was cloned into an empty directory,
built from scratch with `npm ci`, and served pages against the database. It
works. Everything the archive holds is restored by that drill except the
database structure step, which was not run into a separate Supabase project —
so rehearse that once yourself before you trust it in an emergency.

**An archive on this disk is not a backup.** Copy the `.tar.gz` to iCloud
Drive, an external drive, anywhere off-machine, and check what the free
Supabase plan actually covers (Project Settings → Database → Backups — the
free tier has historically had no scheduled backups).

Two gaps the archive cannot close, both worth five minutes now:

- **`DATABASE_URL` and the Supabase keys** are inside the archive, but a lost
  laptop is exactly when you cannot read it. Put them in a password manager.
- **The repo is the only copy of the code.** Enable Time Machine, or keep the
  `.tar.gz` somewhere that is not this laptop.

---

## 8. Final pass

- [ ] A notice's **Join now** lands on a `.gov.in` / `.nic.in` page, not an
      aggregator.
- [ ] `/contact` shows a mailbox that someone actually reads.
- [ ] No page claims affiliation with any government body.
- [ ] The daily filing job has run at least twice unattended since deploy.
- [ ] The repo is private (step 1) — confirm this again, it is the one that
      gets forgotten.
