# NSEA events calendar

Source of truth: `data/events.csv` + `data/venues.csv`, edited through the admin page at `/admin/` (no spreadsheet needed).
`node build.mjs` generates `site/` (index.html, events.json, feeds/*.ics, admin/index.html). The `site/` folder is build output and is not committed.

## Go live (GitHub Pages)
1. Settings > Pages > Source: GitHub Actions. Push to `main` (or run the workflow from the Actions tab) to deploy.
2. Custom domain: Settings > Pages > Custom domain = events.nseaswimteam.com, then add a DNS CNAME record for `events` pointing to jpmerchant.github.io. Enable "Enforce HTTPS". Do this BEFORE families subscribe to feeds.
3. Link to it from the Calendars menu in BUILD, or embed it with an iframe.

## Admin page SETUP (one time per admin)
1. Add the person as a collaborator on the repo (Settings > Collaborators) with Write access.
2. They sign in to GitHub, then Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
3. Resource owner: jpmerchant. Repository access: Only select repositories > nsea-events. Permissions: Contents = Read and write. Expiration: up to 1 year.
4. Open https://events.nseaswimteam.com/admin/ (or your Pages URL + /admin/), paste the token, optionally tick "Remember token on this device", click Connect.
5. Edit events and venues, open "Review & publish", click Publish. The site rebuilds in a minute or two.
Each edit is a git commit, so anything can be undone from the repo history.

## Requirements on events
Each event can have any combination of: a sign-up deadline (+ link), a volunteer sign-up (link and/or deadline), a selection process (+ link and short summary), and qualifying standards (pick from the Standards tab, + optional link to the meet's qualifying times).
- Sign-up and volunteer deadlines also appear in the calendar feeds as their own all-day entries (and in deadlines.ics) and in the home-page widget.
- Standards live in `data/standards.csv`. Use the same names as the standards explorer. Set the explorer's page address on the Standards tab (`data/settings.json`); events then link to it as `?std=Name1|Name2`. The explorer needs a small update to read `std` and preselect those standards.
- The public page has a "Requires" filter for these three.

## Home page deadlines widget
`/widget/` shows the next 5 upcoming deadlines (sign-up deadlines and deadline-type events) with days left and Sign up buttons. It updates itself from the same data. Embed it in a BUILD Custom HTML block:

    <iframe src="https://events.nseaswimteam.com/widget/" title="Upcoming deadlines" style="width:100%;height:420px;border:0" loading="lazy"></iframe>

Options on the URL: `?max=3` (1-15 rows), `?days=60` (only deadlines within 60 days). Links to the full calendar go to the site root of the events page.

## Event types and tags
- **Types tab:** add types, rename labels, pick a badge color. Keys are fixed once created. Meet and Deadline are built in (feeds and the home-page widget use them): rename only. Types in use can't be deleted. Data: `data/types.csv`.
- **Tags tab:** rename a tag everywhere, merge two tags (rename one to the other's name), or remove a tag from all events. New tags are still added from the event form.

## Editing notes
- Undated events: choose "No, month only". They show as "Date TBD" and stay out of the calendar feeds until a date is set.
- Never change an event's ID after publishing. It is the calendar UID, so a change creates duplicates for subscribers.
- Add `?admin` to the public page URL to see the "needs review" notes.
- Venue map links use the venue's "map search text".
- The CSV columns are documented by the admin form; `tools/seed.py` is the one-off script that created the first data and is not needed day to day.

## Needs attention and recent changes

- **Admin > Needs attention** lists data problems as you edit: tentative meets within 30 days, past dates still tentative, meets with no venue or sign-up deadline, deadlines with no link, selection/standards boxes checked but empty, standards with no link, and anything flagged for review. Click a row to fix it.
- **Public page** shows a "New" or "Updated" badge (hover for what changed) on events edited in the last 7 days, plus a "Recent changes" list. It is computed at build time from git history of `data/events.csv`; commits touching more than 12 events at once are treated as bulk imports and ignored. The workflow checks out full history (`fetch-depth: 0`) for this.
