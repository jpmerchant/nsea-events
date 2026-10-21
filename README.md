# NSEA events calendar

Source of truth: `data/events.csv` + `data/venues.csv` (import both into one Google Sheet as two tabs).
`node build.mjs` -> `site/index.html` (self-contained), `site/events.json`, `site/feeds/*.ics`.

## Go live (GitHub Pages)
1. Import the two CSVs into a Google Sheet (tabs: Events, Venues). Add dropdown validation to type/groups/status.
2. File > Share > Publish to web > each tab as CSV. In the GitHub repo, add secrets EVENTS_CSV_URL and VENUES_CSV_URL (Settings > Secrets and variables > Actions).
3. Push this folder to a new repo (e.g. jpmerchant/nsea-events). Settings > Pages > Source: GitHub Actions. Run the workflow once (Actions tab > Run workflow).
4. Custom domain: Settings > Pages > Custom domain = events.nseaswimteam.com, then add a DNS CNAME record for `events` pointing to jpmerchant.github.io. Enable "Enforce HTTPS".
5. Link to it from the Calendars menu in BUILD, or embed it with an iframe.

Set the custom domain BEFORE families start subscribing to feeds; the feed URLs come from the page's own address.

## Editing
- Dates: YYYY-MM-DD in start/end, precision=day. Undated events: precision=month and month_hint=YYYY-MM (shown as "Date TBD", excluded from feeds).
- groups: All, or any of Splash;Tidepool;Riptide;Breakers;Surge;Senior (semicolon-separated).
- type: meet, team-event, deadline, schedule, camp. status: Tentative or Confirmed.
- Keep each `id` stable. It is the calendar UID, so edits update subscribers' events instead of duplicating them.
- Add `?admin` to the page URL to see the needs_review notes. Clear needs_review once resolved.
- Venue map links come from venues.csv map_query. Rows with verified=no need a check.
