# SiteOS design v2: implementation handoff

Prepared 2026-10-08 for the `site-os-portal` implementation, which starts 2026-10-09 and will be a joint effort.

**Status:** the prototype is complete for every planned area (foundation, people and roles, jobs, scheduler / time clock / JSAs, fleet, company, auth and states, dashboard). It was checked in light and dark mode at phone (375), tablet (768, 820, 1024, 1180) and desktop widths, in Chromium only. It has not been run on real touch hardware or in Safari or Firefox.

## 1. What this is and how to use it

- The prototype is **static HTML, CSS and JavaScript with mock data**: no build step, a hash router, one global scope. It is a visual and behavioural reference, **not code to port**. The CSS tokens and layout ideas carry over; the JavaScript does not.
- It lives in the GitHub repo `Mohamad-Ismail-SiteOS/design-v2` (and locally in `SiteOs/design-v2/` next to the other repos). `main` is the version to build from; branch `multi-company` is an archived variant with multi-company switching (not in scope, see section 2). This repo is the single source of truth for the design context; the portal repo does not carry a copy of this document.
- **Run it:** double-click `serve-design.bat` (installs Python 3.12 for the current user if it is missing), then open <http://localhost:5180/>.
- **Explore it:**
  - *View as* switcher in the top bar: Owner, Superuser, Admin, Supervisor, Employee. It shows what each permission level sees. The `perm` strings in the prototype are the same claim names as the portal's `Permission` enum (for example `view:company` is `Permission.ViewCompany`).
  - Moon icon: light and dark mode. `Ctrl K`: command palette. `#/states`: catalogue of every empty, loading and error state.
  - Login helper box (prototype only): any employee email, password `Siteos!2026`, two-factor code `123456`, recovery code `RC4X-92KD`.
- Other files in the prototype folder: `PLAN.md` (decisions in section 6, a field-by-field inventory of the shipped forms in section 8, a file map in section 7) and `HANDOFF.md` (this document).

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Dark mode | Ship it. Toggle in the top bar, remembered per browser, defaults to light. |
| Images | Initials only for avatars. Logos and other missing assets are added when provided. The login photo and the drawn page banners are approved stand-ins. |
| Dashboard widgets with no API | Keep as dummy data and build them last, after everything that already has an API is wired. |
| Overtime rulesets | Follow the portal: one seeded ruleset, "Standard Overtime" (default), editable, with add and delete. |
| Multi-company | Not in the product for now. One account is one company: the sidebar shows the company name as a label, no switcher. The portal's platform-only `/companies` pages are out of scope. |
| Job statuses | How Planned, On hold and Completed get set: ask the team lead or project owner when the Jobs work starts. |
| User management | One sidebar item with Employees, Customers and Roles tabs, as shipped. Owner and Superuser are account types, not roles. |
| Product name | "SiteOS" (one word) in all user-facing text. |
| Anything else that differs | Match the prototype and the portal case by case, as fits best. |

## 3. Portal conventions the build must follow

From the portal's `CLAUDE.md`; none of these are optional.

- Reuse the `@core` and `modules/main` components first. Build a new one only when nothing fits, and build it as a reusable component, not inline.
- Forms use the `Form*` wrappers from `@core/form` with a `joi` schema.
- API calls go through request classes (`requests/<verb-noun>.request.ts`), never axios in a component.
- Use the path aliases (`@modules`, `@core`, `@assets`, `@configs`, `@shared-utils`, `@utils`). Wrap user-facing text in `trs('...')`.
- Every UI `.tsx` has a sibling `.scss`. Every new or changed feature file gets a colocated test (`renderWithProviders` and `server` from `@test-utils`). CI runs `yarn test:run` and a demo build on every PR.
- Run `yarn lint` and `yarn test:run` before calling anything done. Commit messages are `TICKET-ID: description`.
- Suggested working agreement for a joint effort: one slice per branch and PR (section 9), branch from a freshly fetched `main`, and agree up front who owns the shared pieces in slices 0 to 2 because every later slice depends on them.

## 4. Design tokens to portal theme

The prototype's whole look is a semantic token layer: CSS custom properties on `:root` with a second set on `[data-theme="dark"]`. The authoritative values are in **Appendix A**. The names are what the team should reuse.

### 4.1 How the prototype colours map onto the portal palette

The brand blue and the text colour are the portal's own palette values, so the two designs already agree. Most others are within a few ΔE of a palette step (a few units on the CIE76 colour-difference scale, where under 4 is hard to tell apart on screen). A handful have no palette equivalent.

| Token | Light | Dark | Portal palette match |
|---|---|---|---|
| `--brand`, `--act`, `--info` | `#3F5EA6` | `#8AA4E4`, `#6F8FDB`, `#8FA9E8` | `skyBlue.c700`, exact |
| `--brand-200` | `#BAC7E5` | `#2C3B66` | `skyBlue.c500`, exact |
| `--brand-dark`, `--act-hover` | `#34508F` | `#7792D8`, `#86A2E6` | `skyBlue.c750` `#324B85`, close |
| `--brand-deep` | `#253B6E` | `#6481CC` | `blue.c700` `#213C75`, close |
| `--brand-050`, `--info-soft` | `#EEF2FA` | `#18203A`, `#16203A` | `skyBlue.c150` `#EFF2F9`, close |
| `--brand-100` | `#DCE4F4` | `#1E2948` | `skyBlue.c300` `#D8DFF0`, close |
| `--paper` (page background) | `#F5F7FA` | `#0F1218` | `skyBlue.c100` `#F7F9FC`, close (this is the portal's `background.default`) |
| `--surface` | `#FFFFFF` | `#171B24` | white, exact |
| `--surface-2`, `--surface-3`, `--surface-sunk` | `#FAFBFD`, `#F2F4F8`, `#EAEDF3` | `#141820`, `#1C212C`, `#11151C` | `skyBlue.c100`, `skyBlue.c150`, `navy.c100`, close |
| `--text` | `#1D202A` | `#E8ECF4` | `navy.c700`, exact |
| `--text-muted` | `#4A5163` | `#B3BBCB` | `navy.c450` `#464E64`, close |
| `--text-subtle` | `#5D6476` | `#A0A9BB` | **no match** (nearest is `navy.c400` `#57617D`) |
| `--text-faint` | `#6B7284` | `#8A93A6` | **no match** (nearest is `navy.c350`, see 4.3) |
| `--border`, `--border-soft`, `--border-strong` | `#E3E7EE`, `#EEF1F5`, `#D2D8E2` | `#272E3B`, `#1F2530`, `#364052` | `navy.c100`, `skyBlue.c150`, `navy.c150`, close |
| `--ok` / `--ok-soft` | `#1E7A4F` / `#E5F4EC` | `#4CC38A` / `#10261C` | **no match** for the text colour (nearest `emerald.c700` `#047857`); soft is `emerald.c50`, close |
| `--warn` / `--warn-soft` | `#8A5A08` / `#FBF3E1` | `#DDAA37` / `#2A2110` | **no match** (nearest `glow.c800` `#7C5900`); soft is `glow.c150`, close |
| `--bad` / `--bad-soft` | `#B42318` / `#FDECEA` | `#F2837A` / `#2C1614` | `red.c650` `#AF1212`, close; soft is `blush.c250`, close |
| `--warn-dot`, `--bad-dot` | `#D9A441`, `#D2694F` | `#DDAA37`, `#E5826E` | no match |
| Chart series `--s1` to `--s7` | `#3F5EA6`, `#9DB0DA`, `#2F8C8F`, `#D9A441`, `#D2694F`, `#7690CB`, `#C3CAD8` | `#7E9BE0`, `#A9BCEB`, `#4DB3B5`, `#E0B65C`, `#E5826E`, `#4F6FB8`, `#4A5366` | `s1` and `s6` are exact (`skyBlue.c700`, `skyBlue.c600`); the rest are close or new |

**Recommendation:** add the token layer as new SCSS and CSS custom properties (for example `cl-core/theme/style/_tokens.scss`), not as edits to the generated palette (`palette.ts` and `_palette.scss` are generated by `yarn generate-colors`). Where a token is exact or close, define it from the generated palette variable (`--brand: #{$cl-skyBlue-700}`) so it stays in sync. For the "no match" rows, add new tokens; do not snap them to the nearest step.

### 4.2 The action colour is a decision to make early

The portal theme sets `primary.main` to `skyBlue.c500` (`#BAC7E5`) with white `contrastText`. White on that blue is **1.7:1**. The prototype's action colour (`--act`) is `skyBlue.c700` (`#3F5EA6`), which is **6.2:1** with white text.

Moving `primary.main` to `c700` (with `dark` = `c750` and `light` = `c500`) is the right mapping, but it changes the look of everything that uses `color="primary"` (contained buttons, checkboxes, radios, icon buttons, the focus ring). Decide this before starting slice 0 and do it in one place.

### 4.3 Typography

- Prototype: **Geist** for text and **Geist Mono** for plate numbers, codes and key hints, 14px base, tabular numbers on (`font-variant-numeric: tabular-nums`) so figures line up. The portal uses **Poppins** (`src/index.scss` and the theme). Decision: adopt Geist (self-host it, for example with a `@fontsource` package) or stay on Poppins. Moving to Geist is a theme and global-style change, not a per-screen one.
- **Do not snap text greys to the nearest palette step.** `--text-faint` is 4.81:1 on white and 4.56:1 on the page background. `navy.c350` (`#697596`) would be 4.58:1 on white but **4.34:1 on `skyBlue.c100`, which fails AA** for body text. `--text-subtle` is fine either way but is not an exact step. Use the token values.

### 4.4 Shape, size and elevation

| Element | Prototype | Portal today |
|---|---|---|
| Card radius | 16px, 1px border, light shadow `--e1` | `MuiCard` radius 20px, shadow `0 4px 8px rgba(0,0,0,.05)` |
| Input | 40px high, 10px radius, 1px `--border-strong`, focus ring 3px `--brand-050` | 48px high, 6px radius, 2px sky-blue focus border |
| Button | 40px high, 11px radius; small 32px, 9px radius | 12px vertical padding, 8px radius, no text transform |
| Modal | up to 460px wide, 18px radius, `--e4` shadow | `base-modal` |
| Top bar | 62px, content max-width 1680px, 24px side padding | `navbar` and `layout-main` |
| Elevation | `--e1` to `--e4` (values in Appendix A, stronger in dark) | single shadow in `MuiCard` |

These differences are small individually but add up. Decide once, as a team, whether the portal adopts the prototype's control sizes (and especially the 40px input height, which changes every form's rhythm) and then change them in the theme, not per form.

## 5. Dark mode

How the prototype does it: `data-theme="dark"` on `<html>` (a second token set, plus `color-scheme: dark` so native controls and scrollbars follow), toggle in the top bar, choice stored in `localStorage` under `siteos.theme`, light by default. Every screen was checked for text contrast (WCAG AA) in both themes.

What the portal needs (measured on the checked-out branch): the theme is a single `createTheme` with no dark palette, and component overrides hard-code `colors.white` (input roots, button groups, outlined icon buttons). About 140 TSX files reference `palette.*` directly, about 40 TS and TSX files hard-code white, black or a hex value, and 16 of the 135 SCSS files contain colours (most SCSS is layout only). Plan for roughly 150 to 180 files over time, not one big change.

Suggested approach:

1. **Token layer** (slice 0): the CSS custom properties from Appendix A on `:root` and `[data-theme="dark"]`, set from the palette where exact or close. Add a tiny inline script in `index.html` that sets `data-theme` from `localStorage` before first paint, to avoid a light flash.
2. **MUI theme per mode:** build the theme with `createTheme({ palette: { mode } })`, chosen by the same state that sets `data-theme`. Replace the hard-coded `colors.white` and palette steps in the theme overrides with `theme.palette.*` or the tokens. (Alternative: MUI v5.16's `experimental_extendTheme` with `colorSchemes`; it works but is still experimental in v5, so the two-theme switch is the safer first step.)
3. **Migrate in order:** theme provider, then the shell (navbar, sidebar, layout), then the `@core` components (text field, select, modal, tabs, table, badge), then screens as each slice reaches them. **Rule from day one:** new or changed files use tokens, never raw palette steps or hex.
4. **Third-party pieces:** the Leaflet map needs a dark tile layer or a CSS filter on the tile pane (the prototype draws its own map with `--mapland`, `--mapblock`, `--mapriver`, `--maproad`); Recharts series take their colours from `--s1` to `--s7`; the MUI X data grid and date pickers follow the theme mode. The login photo is the same in both themes.
5. **Verify** each screen in both themes with the checks in Appendix B.

## 6. Shared components: prototype to portal

The prototype's helpers are in `design-v2/js/kit.js`, `kit-extra.js` and `core.js`. The closest existing portal component is listed; "check fit" means read it before reusing, because I have not compared their behaviour line by line.

| Prototype piece | Closest portal component | Note |
|---|---|---|
| Text, email, number, textarea field (`fld`) | `FormTextField` / `text-field` | label, required star, inline error under the field |
| Select, async select, "select plus Add" (`selAdd`) | `FormSelect` / `select`, `select-async`, `creatable-select-field` | check fit for the inline Add |
| Multi-select chips (`msel`) | `select-async` / `checkbox-group` | chip remove buttons need a 36px hit area |
| Date, date range, time | `date-picker`, `date-range-picker`, `date-time-picker`, `time-picker` | |
| Checkbox, radio, toggle, segmented (`tgl`, `seg`) | `checkbox`, `radio-group`, `toggle`, `toggle-button` | |
| Mobile number with country code | `phone-field` | |
| Colour swatches | `color-picker-field` | |
| Dictate button (voice input) | `voice-input-button` | |
| Form section card, accordion (`fsec`, `acc`) | `form-section`, `collapsible-section` | |
| Documents and file drop | `document-sections`, `document-tile-groups`, `file-drop-zone`, `named-file-upload`, `saved-file-tiles`, `document-preview` | |
| Tabs with counts | `tabs` | the underline animation and count pill are new |
| Status pill, avatar | `badge`, `avatar` | initials only |
| Dialog, confirm, type-to-confirm (`dialog`) | `base-modal` | |
| Side drawer (`drawer`) | `right-drawer` (`modules/main`) | full screen at phone width |
| Error alert (`toastErr`) | `cl-core/toast` (`error-alert-modal`) | see section 8, the portal uses a blocking modal queue |
| Empty, error, loading blocks (`stateBlock`, `emptyBlock`) | `error-state`, `page-loader`, `section-loader`, `backend-error-box` | catalogue in `#/states` |
| Lists with filters, paging | `data-grid-table`, `pagination`, `pagination-limit`, `record-count` | table scrolls sideways inside its card on small screens, first column sticky |
| Search within a page | `section-search` | |
| Unsaved-changes guard (`markDirty`) | existing dirty-navigation guard | coverage is partial, check which forms have it |
| KPI card with sparkline | **new** | one reusable stat card with tone, icon, delta pill, sparkline |
| Page header with actions, breadcrumbs, page banner | **new** (banner), layout-level (header) | banner is decorative, see section 8 |
| Sticky form action bar | **new** or per-form | "Nothing saved yet" or "n changes", Cancel, primary action |
| Command palette (`Ctrl K`) | **new** | the prototype searches local data; a real one needs search endpoints, or ship sections-only first |
| Dashboard Customise | **new** | drag, resize (4, 6, 8, 12 columns), hide, reset, per person; needs somewhere to store the layout |

## 7. Route map

| Prototype route | Portal route | Status |
|---|---|---|
| `dash` | `/dashboard` | exists, restyle; widgets stay dummy data until the end |
| `company` | `/my-company` | exists; one page with company form, work rulesets, notifications and journey settings sections |
| `company/edit`, `company/rulesets/:id` | in-page on `/my-company` | the prototype uses separate pages; decide (section 8) |
| `user-management` and `/:tab` | `/user-management`, `/employees`, `/customers`, `/roles` | exists |
| `.../employees/:id`, `.../customers/:id` | same | exists |
| `.../employees/new`, `.../employees/:id/edit`, `.../customers/new`, `.../customers/:id/edit` | none (the portal uses `employee-profile-dialog` and `customer-profile-dialog`) | **new routes**, decided: pages |
| `my-profile` | `/my-profile` | exists (two-factor, phone verify, password live inside it) |
| `jobs`, `jobs/new`, `jobs/:id`, `jobs/:id/edit` | same | exists |
| `scheduler` | `/scheduler` | exists |
| `timeclock` | `/time-clock` | exists, keep the portal's path |
| `pending-requests` | `/pending-requests` | exists |
| `jsas`, `jsas/today`, `jsas/templates`, `jsas/templates/new` and `/:id`, `jsas/:id` | same | exists (`/jsas/templates/new` is `:id` equal to `new` in the portal) |
| `assets`, `assets/new`, `/import`, `/:id`, `/:id/edit`, `/checkout`, `/transfer`, `/return`, `/locations/:type/:id` | `/tools` and the same sub-paths | exists under `/tools`, keep the portal's URLs |
| `vehicles`, `/new`, `/:id`, `/:id/edit`, `/checkout`, `/return` | `/cars` and the same sub-paths | exists under `/cars`, keep the portal's URLs |
| `vehicles/inspections`, `/inspections/new`, `/inspections/:id`, `vehicles/compare/:id` | `/cars/:carId/inspections`, `.../new`, `.../video`, `.../comparisons/:comparisonId` | **differs**: the prototype adds a fleet-level inspections list and detail; the portal is per vehicle (section 8) |
| `journeys`, `journeys/:key` | `/journeys`, `/journeys/:id` | exists, behind the LaunchDarkly `journeys` flag |
| `audit-log` | no route found on the checked-out branch | the `modules/audit-log` container and filters form exist but are not mounted; wire a route gated on `view:audit:logs` |
| `companies`, `companies/new` | `/companies` (platform only) | removed from the prototype; leave the portal as is |
| `login`, `forgot`, `reset`, `verify`, `invite` | `/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/collaboration/invite` | exist, restyle |
| session lock (overlay) | none found | new; check how the portal handles an expired session today |
| `not-found` | the portal redirects unknown paths to `/dashboard` (or `/login`) | decision (section 8) |
| `states` | none | prototype reference only |

The onboarding gate already exists in the portal (`main/components/router/onboarding-gate.ts`) with the **same three steps in the same order** as the prototype: mobile number, two-factor sign-in, company details. Only the banner and the page treatment are new.

The sidebar items already match: Dashboard, My Company, User Management, Jobs, JSAs, Scheduler, Time Clock, My JSAs, Assets, Vehicles, Journeys (the portal's Memberships and Reporting entries are outside this design).

## 8. Where the prototype and the portal differ and need a call

Per the decision to match case by case, each of these should be settled by whoever builds the slice, with the team lead where noted.

1. **Employee and customer add and edit:** dialogs in the portal, full pages in the prototype (a stated requirement: "Add customer is a page with the same UX as Add employee"; the menu action is "Add employee", not "Invite employee"). This needs new routes and turns the two profile dialogs into page forms.
2. **Error alerts:** the portal shows errors and warnings as a single blocking modal queue (`error-alert.state.ts`, a follow-up to SIT-786). The prototype shows persistent, dismissible bottom alerts: errors only, no auto-dismiss, long text truncated with the full text on hover. The modal is the current shipped behaviour; decide whether the design change is wanted.
3. **Unknown URLs:** the prototype shows a "Page not found" screen; the portal redirects silently.
4. **Company page structure:** the portal keeps everything on one page (`/my-company`) with sections; the prototype separates read view, edit accordions and a ruleset editor page.
5. **Inspections:** the prototype has a fleet-level list and detail as well as per-vehicle flows; the portal is per vehicle with a video-inspection variant.
6. **Audit log:** built in the portal but not routed; the prototype shows the finished screen (filters, 6-month active window, archive).
7. **Time-range multiplier:** the API stores it as a ruleset item of type `hour_range` (at most one per ruleset); the prototype shows an "Enable Time Range Multiplier" switch with from, to and multiplier. The form switch should map to the presence of that item.
8. **Job statuses:** open, see section 2.
9. **Primary colour, font and control sizes:** see sections 4.2, 4.3 and 4.4.
10. **Floating chat widget:** the portal renders `OscarChatWidget` on every page except login; the prototype has none. Check it against the sticky form action bar and the phone layout.
11. **Page banners:** a slim decorative band per area (drawn SVG art, a tagline, a live count). The portal has nothing like it. Lowest priority; the count needs the same data the page already loads.
12. **Dashboard:** the prototype keeps the designer's KPI cards and charts on purpose, and every card and chart is fed from mock data. Nothing there may be dropped. The shipped dashboard has its own widgets (stats, jobs map, jobs by status, daily and labour cost); the prototype applies the same idea to the designer's set.

## 9. Suggested build order

Each slice is its own branch and PR. Slices 0 to 2 are the shared base; everything after depends on them.

| # | Slice | Contents | Notes |
|---|---|---|---|
| 0 | Tokens, theme, dark mode | token layer, font decision, primary colour decision, `data-theme` plumbing, toggle, no-flash script | no screen redesign yet; check light mode is visually unchanged apart from the agreed changes |
| 1 | Shell | top bar, sidebar (company label, nav, user row), page header, breadcrumbs, mobile drawer, page banner | responsive rules from section 10 |
| 2 | Shared components | restyle `@core` inputs, selects, buttons, tabs, badges, modal, right drawer, tables and paging, empty and error states, KPI card | each behind the tokens; keep behaviour |
| 3 | Auth | login, register, two-factor, forgot, reset, verify, invite, gate banner, session lock | login photo panel with callouts is optional polish |
| 4 | Profile and user management | My Profile, Employees, Customers, Roles | includes the new add and edit pages |
| 5 | Jobs | list, detail, add and edit | settle job statuses with the team lead first |
| 6 | Scheduler, Time Clock, Time Requests | grid, shift drawer, clock card, requests | the week grid scrolls sideways inside its card by design |
| 7 | JSAs | register, templates, builder, today, fill and approve | |
| 8 | Fleet | Assets, Vehicles, Journeys | reconcile inspection routes first |
| 9 | Company and audit log | My Company, rulesets, notifications, journey settings, audit log route | single seeded ruleset |
| 10 | Dashboard | layout, Customise, KPI cards | live data last, as decided |

Wiring what already has an API comes first in every slice; the dummy-data widgets are the last thing to replace.

## 10. Responsive and touch

Breakpoints the prototype uses. The portal's MUI defaults are different (sm 600, md 900, lg 1200), so either set `theme.breakpoints.values` to these or use media queries directly.

| Width | What changes |
|---|---|
| 1240px and up | docked sidebar; four-card rows 4 across, five-card rows 5 across |
| 1101 to 1239px | docked sidebar; four-card rows 4 across, five-card rows as three over two |
| up to 1100px | sidebar becomes a drawer; hit-area rules apply (also on any `pointer: coarse` device) |
| 761 to 910px | four-card rows 2 by 2; five-card rows three over two |
| up to 900px | sign-in becomes a single column with a photo header (taller on small tablets) |
| up to 760px (the designer's) and 720px (ours) | phone layout: 2-column KPI rows, full-width page-header actions, drawers full screen, tables scroll sideways inside their card with the first column sticky |

Rules that were applied everywhere:

- **No horizontal page scroll** at any width. Wide tables and the scheduler grid scroll inside their own card.
- **Tap targets:** a minimum of 32px effective height, 36px preferred. Small controls (breadcrumb links, text links, toggles, switches, chips, row menus, "Add" buttons) get an invisible larger hit area with an `::after` pseudo-element, without changing the layout:
  ```css
  .crumbs a, .lnk, .tog, .swb { position: relative; }
  .crumbs a::after, .lnk::after { content: ""; position: absolute; inset: -10px -6px; }
  .tog::after, .swb::after { content: ""; position: absolute; inset: -8px -3px; }
  ```
  These apply at 1100px and below and on `pointer: coarse`. The `pointer: coarse` half still needs testing on a real touch screen, which is planned for the portal implementation (the preview pane only fakes touch below 768px).
- Four-card KPI rows must never leave one card alone on its own row; five-card rows use three over two.
- The sticky form action bar wraps instead of overflowing, and its hint text yields first.

## 11. Definition of done for each screen

- Uses tokens only: no raw palette steps and no hex in new or changed files.
- Looks right in **light and dark**, and at 375, 768, 1024 and 1280 widths.
- No horizontal page scroll; no text under WCAG AA (4.5:1, 3:1 for large text); no interactive element under 32px effective height; visible focus ring.
- Forms: `Form*` wrappers with a `joi` schema, inline errors under fields, "Can't save yet" alert on a failed submit, unsaved-changes guard where the form is long.
- Empty, loading and error states taken from the catalogue (`#/states`), not invented.
- Text wrapped in `trs()`, requests in request classes, a colocated test, `yarn lint` and `yarn test:run` green.
- Permissions checked against the *View as* personas for that screen.

## 12. Prototype-only: do not build

- The *View as* switcher, the "Demo only" box on the login screen, the reset-demo button and every `data*.js` mock file.
- The `#/states` catalogue page and the `Preview` entries in the command palette.
- Mock behaviour that stands in for the backend (the Google sign-in chooser drawer, the simulated emailed links, the fixed demo accounts).
- The archived multi-company code (branch `multi-company`, and the dormant `MULTI_COMPANY=false` block in `views-platform.js`).

## 13. Not verified, known limits

- Chromium only. The prototype uses `color-mix()`, `:has()`, container-query units (the login photo callouts) and the CSS `inset` property; check them against the portal's supported browsers before relying on them (the portal's `package.json` declares no `browserslist`).
- No real devices. The `pointer: coarse` rules and the 36px hit areas still need a hands-on pass on a touch screen.
- Mock data throughout. Counts, charts and lists are illustrative.
- The audits covered the prototype's screens. A screen built in the portal from these tokens still needs its own pass (Appendix B).

## 14. Suggested first day

1. Read sections 2, 4, 5 and 8; agree the three global decisions (primary colour, font, control sizes) because they change the whole theme.
2. Start slice 0 on a branch from a freshly fetched `main`: tokens file, dark-mode plumbing, toggle.
3. In parallel, someone pairs on the shell (slice 1) against `serve-design.bat` open next to the portal.
4. Settle the open calls in section 8 that block slices 4, 5 and 8 (employee and customer pages, job statuses, inspection routes) while slices 0 to 2 are in progress.

## Appendix A: token values (authoritative)

Copied verbatim from the prototype's `css/base.css`. The names are what the portal should adopt; `--r` is the card radius and `--e1` to `--e4` are the elevations.

```css
:root{
  --brand:#3F5EA6; --brand-dark:#34508F; --brand-deep:#253B6E;
  --brand-050:#EEF2FA; --brand-100:#DCE4F4; --brand-200:#BAC7E5;
  --act:#3F5EA6; --act-hover:#34508F; --on-act:#fff;
  --paper:#F5F7FA; --surface:#FFFFFF; --surface-2:#FAFBFD; --surface-3:#F2F4F8; --surface-sunk:#EAEDF3;
  --text:#1D202A; --text-muted:#4A5163; --text-subtle:#5D6476; --text-faint:#6B7284;
  --border:#E3E7EE; --border-soft:#EEF1F5; --border-strong:#D2D8E2;
  --ok:#1E7A4F; --ok-soft:#E5F4EC;
  --warn:#8A5A08; --warn-soft:#FBF3E1; --warn-dot:#D9A441;
  --bad:#B42318; --bad-soft:#FDECEA; --bad-dot:#D2694F;
  --info:#3F5EA6; --info-soft:#EEF2FA;
  --s1:#3F5EA6; --s2:#9DB0DA; --s3:#2F8C8F; --s4:#D9A441; --s5:#D2694F; --s6:#7690CB; --s7:#C3CAD8;
  --track:#EDF0F5; --grid:rgba(29,32,42,.07);
  --band:linear-gradient(122deg,#1D2540 0%,#26345E 50%,#1A2036 100%);
  --mapland:#F1F4F9; --mapblock:#E3E8F1; --mapriver:#CFDDEE; --maproad:#FFFFFF;
  --e1:0 1px 2px rgba(29,32,42,.05);
  --e2:0 1px 2px rgba(29,32,42,.05),0 2px 8px rgba(29,32,42,.05);
  --e3:0 2px 4px rgba(29,32,42,.05),0 10px 24px rgba(29,32,42,.08);
  --e4:0 8px 16px rgba(29,32,42,.08),0 28px 56px rgba(29,32,42,.14);
  --r:16px; --ease:cubic-bezier(.2,0,.2,1); --out:cubic-bezier(.16,1,.3,1); --spring:cubic-bezier(.34,1.4,.5,1);
}
[data-theme="dark"]{
  --brand:#8AA4E4; --brand-dark:#7792D8; --brand-deep:#6481CC;
  --brand-050:#18203A; --brand-100:#1E2948; --brand-200:#2C3B66;
  --act:#6F8FDB; --act-hover:#86A2E6; --on-act:#0B1020;
  --paper:#0F1218; --surface:#171B24; --surface-2:#141820; --surface-3:#1C212C; --surface-sunk:#11151C;
  --text:#E8ECF4; --text-muted:#B3BBCB; --text-subtle:#A0A9BB; --text-faint:#8A93A6;
  --border:#272E3B; --border-soft:#1F2530; --border-strong:#364052;
  --ok:#4CC38A; --ok-soft:#10261C; --warn:#DDAA37; --warn-soft:#2A2110; --warn-dot:#DDAA37;
  --bad:#F2837A; --bad-soft:#2C1614; --bad-dot:#E5826E; --info:#8FA9E8; --info-soft:#16203A;
  --s1:#7E9BE0; --s2:#A9BCEB; --s3:#4DB3B5; --s4:#E0B65C; --s5:#E5826E; --s6:#4F6FB8; --s7:#4A5366;
  --track:#222837; --grid:rgba(255,255,255,.07);
  --band:linear-gradient(122deg,#141A2A 0%,#1B2440 50%,#10141F 100%);
  --mapland:#131824; --mapblock:#1A2030; --mapriver:#1B2C45; --maproad:#0F131B;
  --e1:0 1px 2px rgba(0,0,0,.5); --e2:0 1px 3px rgba(0,0,0,.55),0 2px 8px rgba(0,0,0,.35);
  --e3:0 2px 6px rgba(0,0,0,.5),0 12px 28px rgba(0,0,0,.45); --e4:0 10px 24px rgba(0,0,0,.55),0 32px 64px rgba(0,0,0,.6);
  color-scheme:dark;
}
```

## Appendix B: how the prototype was checked

Use the same criteria on the portal. All checks were run per route, in both themes, at 375, 768, 820, 1024 and 1180 pixel widths (and desktop).

- **Overflow:** `document.documentElement.scrollWidth` must equal the viewport width; list any element whose right edge passes the viewport and has no scrolling ancestor.
- **Contrast:** for every text node, compute the colour ratio against its resolved background (composite semi-transparent layers); fail under 4.5:1, or under 3:1 for text of 24px or more (18.66px bold). **Switch off CSS transitions before reading colours right after a theme change**, or the reads are taken mid-fade and show false failures.
- **Hit areas:** every `button`, `a[href]`, `[role=tab]` and form control must be at least 32px high including any `::after` extension. Native checkboxes and radios are excluded, and a control whose label wraps it is measured by the label.
- **Layout:** no KPI row with a single orphaned card; no card, drawer, dialog or alert partly outside the viewport; sticky bars and the floating chat widget must not cover content.
