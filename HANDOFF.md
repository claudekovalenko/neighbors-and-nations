# Handoff: Neighbors & Nations website rebuild

## Goal
Rebuild https://www.neighborsandnations.org (currently on Wix) as a new site with:
- every existing public page copied over and refreshed
- staff sign-in so staff can edit content themselves
- one searchable hub for all the Google Docs/Sheets/Forms links (replacing the "NNCC Info" sheet)
- Sunday run sheets, rotations, staff meeting notes, prayer list, new-people and care lists moved off Google Sheets and into the site
- a website calendar (Planning Center is the campus-wide reservation system, so it isn't a clean N&N calendar)

YouTube channel: https://m.youtube.com/@NeighborsAndNations

## Stack (already chosen)
- Static site, no build step, vanilla ES modules, hosted on GitHub Pages
- Supabase project `qtqkxblqlrwgpulnktbs` for auth and data. All tables use an `nn_` prefix because the project is shared with other apps.
- Schema is in `sql/schema.sql`. **It has NOT been applied yet**: the Supabase migration needs the user's approval.

## Done
- `js/lib.js`: Supabase client, DOM helper, markdown, modal, date helpers
- `js/app.js`: hash router, header/footer, auth state
- `js/public.js`: home, generic pages, events, prayer request form, give, contact

## To do
1. Copy the live Wix site (all pages, text, images, service times, address, Church Center links) into seed content for `nn_pages` and `nn_settings`.
2. `js/staff.js`: sign in/out, dashboard, links hub, Sunday run sheets (with print view), rotations, teaching schedule, meeting notes, prayer/new people/care lists, calendar, page and settings editor, staff admin.
3. `index.html`, `assets/styles.css`, `.nojekyll`, and a GitHub Pages workflow.
4. Apply `sql/schema.sql`. Seed `nn_staff`, the hub links and the sheet data with SQL run directly against the database. **Never commit private data**: the repo is public.

## Source data in Google Drive (shared with the user)
- Hub: "NNCC Info" `1rkMD3zQPFAOuhMJ19tm_PQKvpdTJ7LDpTkDnEYH9GKk`. Do not import its password cells.
- "NNCC SUNDAY SERVICES" `1g1GBPPGGscAzt4hcvcm1ReQVs0mfH2HcmrEoLVgPFVE` (rotation, run sheets, teaching schedule)
- "Shepherding in Action Sheet" `12ejAaMFF7ZKdg1tMuXEbK2DvOSDxz0vjR76SZOc6XGM` (prayer, new people, care). This is sensitive: staff-only.
- "New N+N Staff Meeting Roles Rotation" `1IztMmna8nVJcUnVgJc2LMNRp2eLQVujqqLAee4mrtds`
- "STAFF MEETING.docx" `1ljAqsMOK4ibu9Ag1ef2Fic0s8bR0Uxk4`
- Sunday Facilitator Checklist `1Xvbrwjxy3sUrM2qWVyJNgY8y_xqmLIk_-CGiE5dO7VE`; Set-up Checklist `1pQ8lwuKD9rJnM20wvNxfocZ0mIeBEVeycmKNOwt4eO4`

## Meeting notes that shape the design
- Older staff struggle with Google Docs and Excel, so editing must feel like a simple form or table.
- Biggest pain point: lost links. Phase 1 is one searchable links page; phase 2 retires Docs/Sheets entirely.
- The Neighbors & Nations account should own all documents going forward.
- Push notifications need a native app later (Apple developer account). This is out of scope for now.
