# SiteOS portal redesign: audit and expansion plan

Working copy of `../index.html` lives in this folder. The original is untouched.
Compared against: `site-os-portal` (routes, sidebar, containers, forms, `Permission` enum), `site-os-api` (controllers), and the design's mock data.

## 1. How the design is built

- One page, hash router (`#/dash`), a `VIEWS` registry (`title, sub, grp, icon, label, act, render, mount`).
- Helpers: `listCard` (tabs, search, filter chips, table), `kpi`, `card`, `donut`, `bars`, `trend`, `funnel`, `steps`, `opsMap`.
- Mock data in one `INIT` object, cloned into `S`.
- `modal()` is a confirm dialog only. `toast()` is the only feedback. 12 flat pages, all admin/owner point of view.
- Every action button is a `data-toast` stub ("The form would open here").

Split in this copy (no build step, opens from `file://`):

```
index.html        shell markup
css/base.css      original styles, verbatim
css/extend.css    new components (forms, drawer, detail pages, ...)
js/core.js        original helpers + data + views, verbatim
js/data.js        extended data aligned to the real product
js/kit.js         form kit, drawer, dialogs, detail shell, tabs
js/views-*.js     new screens, one file per area
js/shell.js       router, nav, palette, theme (extended: param routes, persona)
```

## 2. Discrepancies found

### 2a. Defects inside the design file
| # | Finding | Action |
|---|---|---|
| D1 | Text triple-encoded (`Â·`, `â€"` in 80 lines, title reads "Site OS Â· Operations") | Fixed in copy |
| D2 | References `organisation.css/js`, `icons-3d.css/js`, `assets/prototype-photos/*`: none exist | Refs removed. Photos fall back to initials. Need the real files or a decision to drop photos |
| D3 | Dates are the **2025** calendar labelled 2026: "Wednesday 1 October 2026" is a Thursday; "Mon 29 Sep" is a Tuesday | Re-dated to the real 2026 calendar (Thu 1 Oct, week Mon 28 Sep to Sun 4 Oct, today column index 3) |
| D4 | Product written "Site OS"; the product name is "SiteOS" | Renamed in copy |
| D5 | Hard-coded KPI numbers (31/48 on the clock, 92% on time, $186K) don't derive from the data, so they drift | Derive where possible, mark the rest as sample |
| D6 | Names used in notifications (Hamish Reid) not in the staff list | Seed fixed |
| D7 | Table rows and names are not links, so no list leads anywhere | Rows open detail pages |
| D8 | Toast auto-dismisses in 2.6 s. Agreed alert behaviour for errors: persist, no auto-dismiss, truncate with hover | Add persistent error alert variant |
| D9 | Hard-coded `i===2` for "today" in scheduler and `hi:2` in charts | Parameterised |

### 2b. Chrome and platform behaviour the real portal has and the design lacks
- **Persona**: the real portal is permission-driven. Employees land on My Profile, see My JSAs, own time-clock and own pending requests. Supervisors see a subset. Design is Owner-only. **Add a "View as" switcher** (Owner / Admin / Supervisor / Employee) that gates nav, buttons and fields.
- Sidebar: collapse to 64px, pin items, pending-count badges (time requests, JSAs), feature-flagged Journeys, locked nav during onboarding.
- Onboarding gate: mandatory phone number and company details block everything else.
- Unsaved-changes guard on every form and navigation.
- Company switcher, notifications bell (design bell only jumps to a dashboard strip), profile menu from the user row, live "last updated".
- Auth shell: login, register, verify email, 2FA verify, forgot/reset password, Google callback, collaboration invite landing, contact support. None designed.
- Empty, loading, error and permission-denied states. Only "no matches" exists.
- RTL / multi-language (company form has direction + language): not considered.

### 2c. Pages and features missing, per area
| Area | Real portal has | Design has |
|---|---|---|
| Nav | Dashboard, My Company, **User Management as ONE item with Employees / Customers / Roles tabs**, Jobs, JSAs, My JSAs, Scheduler, Time Clock, Pending Requests, Assets, Vehicles, Journeys, Companies (platform) | Split User management into three sidebar pages (**decision: keep the shipped single item with tabs; done in v2**). Missing: **My JSAs, Pending Requests, JSA Templates/Today, Asset Locations, Shared jobs, Companies** |
| Dashboard | Customisable layout (customise/reset), prev/next week and year, labour cost trend, daily employee cost, regular vs overtime, jobs by status, "my upcoming shifts / my active jobs" | Invented widgets with no endpoint: shift attendance, geofence funnel, "needs attention", on-time %. API has `stats, my-stats, charts, daily-costs, labour-cost-trend, layout` only. Flag as design-only |
| Employees | Detail with tabs Overview, Work profile, Documents (visibility Everyone / Only me / Owner+Admin), Notes, Payslips, Work rules, Activity, Time off and Timeline ("coming soon"); form with account, work profile, next of kin, emergency contact, hourly + cost rate, employment basis, "appears in scheduler", send invite by email + SMS; admin set-password | List only |
| Customers | Detail (Overview, Profile, Collaboration, Activity), create/edit with ABN validation, reactivate archived, invite emailed | List only |
| My profile | Personal details, picture, **security: mandatory 2FA, authenticator app, SMS, recovery codes, email/phone verification, change password**, documents, notes, my activity, my submissions, shared with me, work rules | Nothing |
| Roles | Company-defined roles (unlimited), ~50 permissions in ~12 groups, owner-tier permissions only the owner can grant, one role per employee, per-employee overrides cleared on role switch, reset default roles, live "changed elsewhere" banner | Fixed 4-role x 11-permission matrix, invented permission names |
| Jobs | Add/edit: name, number, **external number, colour, customers (multi), project manager, supervisors, qualified users/groups, estimated cost, sell price, address search + GPS lat/lng + "my location", geofence radius, daily JSA auto-send (template + time), documents**; detail with expand/collapse sections; archive/unarchive/delete; "Shared with me" (cross-company collaboration) | List only. No archive action, no shared tab |
| Scheduler | Week and month, publish week, copy previous week, clear week/drafts, templates, time off, unavailability, claimable shifts, group shifts, overlap warning, labour cost and man-hours totals, shift form (title, job, dates, repeat weekly, users) | Week grid only |
| Time Clock | Timesheets, today actions report, shift history, payroll-period export, overtime/weekend, correction audit (original vs modified/added/removed), approver, request-correction form | Entries list + approve/reject |
| Pending requests | Own page; employees see own, managers review | Folded into a tab |
| JSAs | Sent, filled, awaiting approval, approved, **declined and sent back with reason**; templates + builder; today (fill) page | No decline path, no builder, no fill |
| Journeys | Journey plan with **approval step**, create/edit trip form, trip document, cancel, notify channels, can-drive flags | No approval, no form |
| Assets | Statuses Available / Deployed / Maintenance / Lost / Retired; Assets and Locations tabs; form: asset ID, serial, manufacturer, supplier, department, order no, purchase cost/date, warranty, requires test & tag + next due, images, invoice, documents; detail with assignment history; check out, transfer, return, import CSV | Invented statuses (tag expired as a status) |
| Vehicles | Make/model/year/VIN/colour/tyre terrain/odometer, rego + insurance + green slip + roadside docs, service records with invoices, photo and **video inspections + comparison**, check out/return with notes, **incident reports** | List only. No inspection flow |
| My Company | Company form: branding/logo, regional, geofence defaults, feature flags, language; **ruleset editor** (rule type, applies-after, days, public holidays, time-range multiplier, effective dates, default); notification editor (type, channels, users + external emails, period) plus "My notifications"; journey settings form | Read-only cards and lists |
| Audit | Activity / audit history inside every detail page | None |

### 2d. Vocabulary to align (design to real)
Asset status, vehicle status (design mixes statuses with derived flags like "Service due"), JSA states, journey states, employee "Invited" state. Permission names must come from the real `Permission` enum.

## 3. Component and UX system to add
1. **Detail page shell**: breadcrumb, hero (avatar/icon, name, status pills, primary actions), tab bar (reuses `.tabs`), main + side rail, section cards with expand/collapse all.
2. **Form kit**: field (label, help, error, required), text/number/money/phone/date/time/select/multiselect/textarea, toggle, segmented, address search with map pin, colour swatches, file/photo drop, repeater rows, form section card, sticky action bar, dirty guard, inline validation.
3. **Containers, with a rule**: drawer for short forms (customer, asset, shift, time entry, request correction); full page for long forms (employee, job, vehicle, journey, ruleset, company); modal for confirm/destructive (type-to-confirm for delete).
4. **Feedback**: toast (success, auto-dismiss), persistent error alert, inline banners, skeleton loaders, empty states with a call to action, permission-denied state.
5. **Shared blocks**: document row, notes thread, activity timeline, key-value editor, assignment history, member avatar stack.
6. **Permission affordances**: disabled-with-tooltip, hidden financial fields, owner-tier lock.

## 3b. Account types vs roles (rule)
Owner and Superuser are **account types**, not roles. They are set in the backend and checked in the frontend (`isOwner`, `isSuperuser`, `isPlatformOrOwner`), and both implicitly hold every permission. Roles apply only to ordinary employees, one each.
- The Roles list never contains Owner or Superuser.
- Only the owner can create a superuser, change an account type, manage a superuser (edit, set password, archive), grant the owner-only financial permissions, change who may assign a role, or reset default roles.
- Employee screens show **Account type** (Owner / Superuser / Employee). Role and permission overrides apply to Employee accounts only.
- A superuser still counts as staff (profile, timesheets, pickers).

## 4. Roles screen redesign (does not fit today's UX)
Matrix of 4 fixed columns cannot hold unlimited company roles or 50 permissions. The shipped Roles screen is already list + editor; v2 keeps that structure (see section 8) and restyles it. Original proposal, now superseded where it differs:
- **Left**: role list (name, member count, built-in/custom pill, search, New role, Reset defaults for owner).
- **Right**: role editor with header (name, description, member avatars), then permission **groups as accordions** (icon, "n of m", select all / clear), each permission a toggle row with a one-line description and dependency hint. Owner-tier rows show a lock and "Only the owner can change this". Sticky save bar with discard guard. "Changed elsewhere" banner.
- **Compare tab**: the original matrix kept as a read-only overview (groups collapsed to counts, expandable).
- **Members tab**: who holds the role, change role (one role per person).
- **Employee > Permissions tab** reuses the editor: inherited vs overridden badge, note that changing role clears overrides.

## 5. Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Copy, split, encoding, names, dates; param router; persona switcher; form kit, drawer, dialogs, detail shell | **done** |
| 1 People | One **User management** page with Employees / Customers / Roles tabs; employee detail + add/edit page + permission overrides; customer detail + add/edit page; My profile incl. security; Roles list + editor. Forms re-aligned to the shipped structure (section 8) | **done** |
| 2a Jobs | Jobs list (Jobs / Shared with me, row menu, status), job detail (collapsible sections), add / edit page, archive / delete, documents, daily JSA | **done** |
| 2b Operations | Scheduler (shift drawer, week + month, copy / clear / publish week, time off, unavailability); Time Clock (Today + Timesheets, request correction, Time Requests); JSAs (assign, detail, fill, approve / send back, My JSAs, templates + builder). The designer's KPI cards and charts are kept on Scheduler, Time Clock and Roles | **done** |
| 3 Fleet | Assets (detail, form, check out/transfer/return, import, locations); Vehicles (detail, form, service records, inspection + compare, incidents); Journeys (form, approval, detail) | next |
| 4 Company | Company edit, ruleset editor, notification editor, journey settings, audit log, collaboration/shared jobs, companies (platform) | after |
| 5 Auth and states | Login, register, verify, 2FA, forgot/reset, onboarding gate, 403/404, empty/error/loading catalogue, dashboard customise | after |

## 6. Decisions for the team (open questions, answered 2026-10-08, ahead of implementation in the portal)
1. ~~Photos~~ **Initials only for now.** Logos and the missing assets get added when they are provided. The login photo and the drawn page banners are approved as stand-ins.
2. ~~Dashboard widgets with no API~~ **Keep as dummy data, build them last.** Wire everything that already has an API first, then add the APIs for the widgets.
3. ~~Sidebar: three People items or one User Management with tabs?~~ One item with tabs, as shipped.
4. ~~Dark mode~~ **Ship it.** The toggle is in the top bar and remembers the choice; it defaults to light.
5. ~~Overtime rulesets~~ **Follow the portal.** One seeded ruleset, "Standard Overtime" (default), editable, plus add and delete as the portal allows.
6. ~~Multi-company~~ **Not in the product for now, and not in the design.** One account is one company: the sidebar shows the company name as a label (no switcher), My Company has no "All companies" button, and `#/companies` and `#/companies/new` are removed (Page not found). The shipped portal's `/companies` is for SiteOS platform staff only and is out of scope here. The pages are kept dormant in `js/views-platform.js` (`MULTI_COMPANY=false`) and the complete working version is on the local git branch `multi-company`.
7. **Job statuses** (how Planned, On hold and Completed get set): revisit when the Jobs work starts and ask the team lead or project owner.
8. Anything else where the prototype and the shipped portal differ: match them case by case as fits best while implementing. Touch behaviour (the `pointer:coarse` hit-area rules) gets tested on a real touch screen during the portal implementation.

## 7. Where things live (v2)

**Run it:** double-click `serve-design.bat` (or `serve-design.bat 5190` for another port) and open http://localhost:5180/. It serves this folder with Python's built-in web server, bound to localhost, and opens the browser. If Python 3 is missing it installs Python 3.12 for the current user by itself (winget, or the official python.org installer as a fallback), no admin rights needed.

Routes (same shape as the shipped portal): `#/user-management/{employees|customers|roles}`, `.../employees/:id`, `.../employees/new`, `.../employees/:id/edit`, `.../customers/:id`, `#/my-profile`.
Old flat links (`#/employees`) still resolve through `ALIAS` in `js/shell.js`.

| File | Contents |
|---|---|
| `js/views-um.js` | The User management container and its tab bar |
| `js/views-roles.js` | Roles tab, shared `permGroups` editor, move-role flow |
| `js/views-employees.js` | Employee list actions, detail, form, documents, notes, payslips, permission overrides, work rules, activity |
| `js/views-customers.js` | Customer detail, add/edit page, collaboration, ABN check |
| `js/views-me.js` | My profile, two-factor, recovery codes, password |
| `js/views-jobs.js` | Jobs list tabs, job detail, add/edit page |
| `js/views-scheduler.js` | Scheduler: week / month grid, shift drawer, publish / copy / clear, unavailability |
| `js/views-timeclock.js` | Time Clock (Today, Timesheets), request correction form, Time Requests |
| `js/views-jsas.js` | JSAs list, assign, detail / fill / approve, My JSAs, templates + builder |
| `js/data.js`, `js/data-ops.js` | People, roles, permissions, jobs; shifts, requests, JSA templates and answers |
| `js/kit.js`, `js/kit-extra.js` | Form kit, drawer, dialogs, persistent error alerts, unsaved-changes guard, tabs, hero; multi-select, swatches, row menu, collapsible sections |

Run: `python -m http.server 5180 --directory design-v2`, then http://localhost:5180 (also a `design-v2` entry in `.claude/launch.json`).
After pulling script changes, hard-refresh (Ctrl+Shift+R): the static server lets browsers cache scripts.

## 8. Real form inventory (checked against the running portal + code)

Principle from the team: **new look, familiar structure.** Fields, order, section names, help text and behaviour stay as shipped. Containers can change when the page benefits.

| Form (shipped) | Container today | Sections / fields in shipped order | v2 |
|---|---|---|---|
| Add employee | dialog | **User account** (first*, last*, email*, mobile* with country code, address search / "Enter address manually"), **Work profile** (job title, employment basis + inline **Add**, hourly rate, cost rate auto, site worker, send invite), **Emergency contacts** (next of kin / emergency contact toggles), **Access** (role) | Built as a page, same sections and order |
| Edit employee | inline in the profile card (Edit, then Save / Cancel) | same fields plus username, display name | Built as the same page form |
| Employee detail | left profile card + tabs | Overview (User profile, Work profile), Work Rules, Activity, Time off, Notes, Documents, Timeline, Payslips (several locked behind flags) | Same tab names and order; Permissions tab added |
| Notes (employee) | dialog | Note*, Visibility* (default Only me; Everyone / Owner + Admin) | Drawer with the same fields |
| Documents (employee) | dialog + table | Active / Expired toggle, several files per document, expiry, visibility | Same, as drawer |
| New customer | dialog | **ABN number\*** first (auto-checked, link existing company instead of duplicating), first*, last*, company name*, email* ("we email an invitation"), mobile*, address | Built as a page (same layout as Add employee), same order, ABN check with link / reactivate / register lookup |
| Customer detail | left card + tabs | Overview (Profile, Contact), Collaboration (jobs shared automatically on job creation), Activity and Note (placeholders in the product today) | Same tabs; Jobs folded into Overview / Collaboration |
| Roles | list + one editor pane | search roles, **+**, delete; Role name*, Description, **Can be assigned by non-owners**, Grant all / Revoke all, search permissions, 12 groups with description and Select all / Clear all, footer "n permissions selected" + Cancel + Create / Update Role, "Reset Admin & Employee to defaults" | Same structure; Members and Compare tabs added |
| My profile | left "Personal details" card (Edit) + tabs | First, last, email, phone, username, Change password, Two-factor (authenticator / email / SMS); tabs Shared with me, My submissions, My activity, Documents | Same tabs; Security split into its own tab |

### Forms still to design (phases 2 to 5), structure to copy
| Form | Container | Fields / sections in shipped order |
|---|---|---|
| Add / edit job (**built in v2**) | page of grouped cards | Job name*, Job number, Color; Description* (dictation mic); Address* (search / manual); My current location, Get address from coordinates, GPS latitude*, longitude*, Geofence radius (m)*; Estimated cost*, Sell price*; Qualified (users); Site supervisors; Customers + New customer; Daily JSA (template, send every day + time); Documents |
| Add / edit asset | page, **bulk** ("Add another asset", "Add all") | Asset ID, Asset name*, Status; Serial number; Supplier, Manufacturer, Location, Department (each select + **Add**); Notes; Order number, Purchase date, Purchase cost (AUD), Warranty expiry; Requires test & tag (+ next due); Images, Invoice, Documents |
| Add / edit vehicle | page | Make*, Model*, Manufacture year, Tyre terrain; Number plate*, ID, VIN; Roadside assistance + phone; Status (+ Add), Speedometer, Color; Registration due, Insurance expiry, Inspection due; Registration document, Insurance policy; Service due date + km; **Service history records**; Vehicle images, Green slip, Service invoices, Documents |
| Add shift | right drawer, header shows the day | Shift dates*, start*, end*, Repeat weekly (+ additional weeks), Shift title, Job*, Users*, Enable users to claim this shift, Address |
| Journey trip | dialog | Employee, Departing from, Departure, Travelling to, Destination job (optional); approval and cancel on the detail page |
| Company edit | page of accordions + Cancel / Update Company | Basic Information, Contact Information, Branding (logo), Regional Settings, Company Settings, Overtime & Pay Rules, Journey Management, Notifications |
| Ruleset | form | Name, description, effective from / to, default; rules (type, days, applies after, public holidays, time-range multiplier) |
| JSA template, assign, fill, approve / decline | pages + modal | template builder, assign (template, job, people), fill (questions + photos), decline with reason |
| Request correction | dialog | original vs requested times, reason |

Behaviours to keep everywhere: required `*`, helper text under the field, "Enter address manually" link, country-code mobile field, select + Add for lists the user can extend, Cancel left of the primary action, sticky action bar, discard prompt.
Not available in this local build (flagged off): Journeys. Employee Activity, Time off, Timeline, Payslips are disabled in the shipped employee page; v2 designs them.

### Jobs: what v2 does (checked against the running portal)
- **List:** tabs Jobs / Shared with me; columns Job, Customer, Supervisors, Geofence, On site, Est. cost, Sell price, Budget used, Status, Created; row menu Edit job / Archive (Unarchive) / Delete. Statuses shown as in the product: Active, Planned, On hold, Completed, Archived. Status is not editable in the shipped form (archive is the only action), so v2 does not add a status field. Open question: how do Planned, On hold and Completed get set?
- **Detail:** page title is the job name; **Expand all** and **Edit** at the top; sections in the shipped order (Financial Information, Basic Information, Location, Customer, Supervisors, Qualified Users, Qualified Groups, JSA, Documents). Added in v2: a four-card summary strip and a geofence map.
- **Permissions:** estimated cost is visible to anyone who can see jobs; cost so far, sell price and margin need the owner-only job financials permission; Add job / Edit / Archive / Delete follow `add:job`, `edit:job`, `delete:job`.
- **Form:** Job details (name, number, color, description with dictation, address search or manual), Location (my current location, address from coordinates, GPS, geofence metres), Costs, People (Qualified, Site supervisors, Customers + New customer), Daily JSA (template, send every day, 5-minute send time), Documents. Delete asks you to type the job code.

### Operations: what v2 does (phase 2b; structure from the running portal and its code)
**Rule: never remove the designer's KPI cards and charts when rebuilding a page.** They are kept (and now driven by the live data) on Scheduler (shifts / hours / assigned strip, hours by day, hours by job), Time Clock (on the clock, hours, requests strip, clock-in trend, capture-source donut) and Roles (roles / permissions strip, reach by role, coverage donut), as well as Employees, Customers and Jobs. They were briefly dropped from the first three and restored after the team asked.
- **Scheduler:** Publish, Actions (Copy previous week, Clear week, Clear unavailabilities, Add time off, Add unavailability), Add shift; filters Job / User / Assigned / Status / Search, Reset all; Users | Jobs, Week | Month, date navigation. Grid corner shows labour cost (hidden without the financials permission), each day shows hours, people, jobs, draft count and cost. Person rows show hours | shifts and a totals popover. Card menu: Edit shift (Edit group shift), Duplicate, Assign user, Remove user, Change time (Update time for this user), Publish / Unpublish, Delete. A person can't be double-booked; overlapping drafts are listed and **not published**. Employees without view schedule see only their own shifts.
- **Time Clock:** tabs Today | Timesheets, "View requests (n)". Today: your clock card with live timer, job, geofence block, break, Clock Out, plus the actions report, Man-days / Active jobs / First check in / Last check out / Worked hours, and who is clocked in. Timesheets: payroll period, job, user, search, Clear, Export view, records with overtime and cost (cost needs financials). Managers edit an entry directly; employees request a correction.
- **Time Requests (/pending-requests):** Pending / Approved / Declined / Withdrawn counters, search, status, review queue with old-to-new diffs; approve (optional note) or decline (reason required); employees see only their own and can withdraw. Request types: correction, add shift, remove shift.
- **JSAs:** JSA templates + Assign JSA; tabs All JSAs | Waiting for me; Assign JSA (job, day, template, approver, Send to crew); detail with progress, the filled form, Approve, **Decline and send back with a reason**, change approver, Send to crew, Edit its template, Delete; crew fill-in (required questions block submit); **My JSAs** in the sidebar for people without the JSA register permission. Builder: template name (also the crew-facing title), Used on jobs (a job moves off its old template), default approver, 15 question types, required, options, reorder, remove, and a phone preview.
- **Found while testing and fixed:** new JSA numbers collided with existing ones (now next free number); a JSA started from a job page had no template or crew (now gets both).

## Fleet: what v2 does (phase 3, built 2026-10-07)
Files: `js/data-fleet.js` (data), `js/views-assets.js`, `js/views-vehicles.js`, `js/views-journeys.js`. The designer's KPI strips, charts and map are kept; the list configs come from `ASSET_LIST()`, `VEHICLE_LIST()`, `JOURNEY_LIST()`.
- **Assets**: Assets | Locations tabs; list with Check out / Check in / Transfer icon buttons and a row menu; detail with collapsible sections and Expand all; bulk Add asset ("Add another asset", Asset ID or Serial required, select + Add, Requires Test & Tag); Check Out / Transfer / Return pages (expired tag blocks check-out); Import wizard (Upload, Map & review, Done); Locations (Vehicles, Job sites, Employees, Others; add, rename, delete) and location detail.
- **Vehicles**: list with Registration / Service / Insurance / Inspection due and attention flags; detail (overview, dates, service records, assignment history, incident reports with Mark as reviewed / Re-open, images, documents); add/edit form with service records and select + Add status; Check Out / Return; Inspections (Inspections | Video Inspection), inspection form, before/after comparison and report with Swap videos.
- **Journeys**: list with real statuses plus live chips; Create trip drawer (five shipped fields plus an optional vehicle, which is an addition); Journey Plan detail (hazard banner with Clear, plan, weather, people, timeline, notification channel, Trip document with Download JSON, Approve, Edit, Cancel). Journeys is feature-flagged off in the shipped portal locally.
- Tested in the browser as owner: asset checkout/transfer/return, bulk add, import, locations; vehicle checkout/return, add/edit, service records, incidents, inspections, comparison; journey create/edit/approve/cancel/clear hazard/trip document. Not yet tested: other personas (admin, supervisor, employee) on the fleet screens, mobile width, dark mode.

## Company: what v2 does (phase 4, built 2026-10-07)
Files: `js/data-company.js`, `js/views-company.js`, `js/views-rulesets.js`, `js/views-platform.js`. The designer's KPI strip is kept on My Company.
- **My Company (read)**: hero (Edit, owner-only Delete), KPI strip, a field search that opens the section and jumps to the field, collapsible Company Information / Contact / Tax / Regional / Additional / Settings (Defaults, Feature Flags, Time Rounding, Job Geofence), Overtime & Pay Rules list, Journey Management summary, Notifications list. Over Head % only shows with the owner-tier financial permission.
- **Edit company** (`company/edit`): the shipped accordions in the shipped order (Basic Information, Contact Information, Branding, Regional Settings, Company Settings, Overtime & Pay Rules, Journey Management, Notifications), Cancel / Update Company. Legal Name follows Company Name, ABN is digits only (11), website gets https://, timezone picks a matching currency, clock-in/out rounding cards with a live example, geofence switch. Overtime rules, journey settings and notifications keep their own Save buttons, as shipped.
- **Ruleset editor** (`company/rulesets/:id`, a page instead of the shipped dialog): details, the pinned Time Range Multiplier card, rule cards (type, name, multiplier, applies after, applies on days, public holidays) with the shipped validation (tiers must rise per day group, Overtime fixed Mon-Fri, Weekend Overtime Sat/Sun only, From and To can't match). No "Add ruleset" button: the shipped portal turns creation off (one seeded ruleset). v2 keeps the designer's three rulesets, which is an open question below.
- **Journey Management**: Journey plans, On the road, Weather, Records and reports groups (fields reveal as in the shipped form) plus the signed-in user's own Push / Email grid, one Save. Non-editors see only their own channels.
- **Notifications**: one rule per type (Employee document expiry, Asset notifications, Vehicle notifications), period 1 or 2 months, Email / SMS, company users plus external emails; picking a type prefills it. Shift reminder and weekly digest are left out because the shipped form hides them.
- **Companies** (owner only): list, Add company (same sections minus the ones that need an existing company), type-to-confirm delete, sidebar switcher drawer. Switching to another company is explained but not simulated. **Switched off 2026-10-08 (see section 6, item 6); the full version is on the `multi-company` branch.**
- **Audit logs** (`view:audit:logs`): shipped filters (Object ID, Actor, Type, Source Active / Archive, From / To with the 6-month rules) and columns, plus a Date column.
- **Page banners**: every page now has a slim themed banner (`js/banners.js`, inline SVG art from the colour tokens, tagline plus a live count). One theme per area: dashboard skyline with crane, company building, people, jobs crane and site, JSAs shield and clipboard, scheduler calendar, time clock face, assets tools, vehicles ute on a road, journeys route, profile, audit and companies. Works in dark mode; art fades on narrow screens.
- Tested in the browser as owner: company edit validation and save, round cards, block-inspection toggle, journey settings and prefs, notification editor (prefill, validation, dedupe, save), ruleset editor (add, tier, days and time-range validation, type change, delete, save), companies (switcher, delete, add), audit filters. Admin / supervisor / employee gating checked.
- Resolved 2026-10-08 (section 6): one seeded ruleset, no multi-company. Still open: onboarding gate (SIT-693) page-pin not designed; collaboration invitations stay on the Jobs "Shared with me" tab.

## Auth, states and dashboard: what v2 does (phase 5, built 2026-10-07)
Files: `js/views-auth.js`, `js/views-states.js`, `js/views-dash.js`. Auth screens are full-screen (`body.authmode`, `#authRoot`), outside the app shell, with the same routes as the shipped portal.
- **Login** (`login`): Email or username, Password (show toggle), Forgot password?, Login, Login with Google, "Don't have an account? Sign up"; `?redirect=` honoured. Wrong credentials give an inline message, with a lock-out message after 5 tries. **Register** (`login?mode=register`): First Name, Last Name, Phone Number (AU mobile), Email, Password with live rule hints (8+ characters, one uppercase, one special), Sign up with Google; then "Waiting for you to verify your email" (Resend link, Back); the new account lands in My profile and the onboarding gate takes over.
- **Two-step sign-in**: Authenticator / Email / SMS switcher, email and SMS send the code first ("Email me a code", then Resend code), recovery-code hint on Authenticator, Verify, Back. An unverified account sees the email wait screen instead. Google sign-in uses a chooser drawer standing in for Google's popup.
- **Forgot password**, **Reset password** (also "Set your password" for invitations via `mode=invite`; checks the link first; invalid or expired link offers "Request a new link"), **Verify email** landing, **Job invitation** (new invitee form, existing account must log in, invalid link).
- **Session expired**: the log-in-again screen over the page you were on (no Forgot or Sign up, Log out underneath). Logging back in leaves the page exactly as it was.
- **Onboarding gate** (shipped order: mobile number, two-factor, company details): while a step is open the user is pinned to the page that fixes it and every other route bounces back; a banner shows the three steps and what to do. Company details uses the company edit page with no Cancel. Completing the last step says "You're all set".
- **Demo helpers**: a "Demo only" box under the login card lists every account (password `Siteos!2026`, code `123456`, recovery code `RC4X-92KD`) and links to each state. Palette actions preview the session lock, each gate step, sign out and the states catalogue.
- **States** (`states` catalogue, palette: "Error and empty states"): first-run empty, nothing matches, all clear, no access, section error with a working Try again, page and section loaders, skeletons, full-page errors 403 / 404 / 500 / 503 (Reload page, Go back to home, dismiss; Esc closes), error and success messages, inline form error, offline bar (also reacts to the browser's offline event). Lists with no rows at all now show a first-run empty with the right action; unknown addresses show a Page not found screen (the shipped portal silently redirects to the dashboard; open question whether to keep that).
- **Dashboard Customise**: Customise, then each widget gets a bar to drag it, pick a width (third, half, two thirds, full), move it earlier or later, or hide it; hidden widgets sit in a tray to bring back; Reset layout and Done. The designer's cards and charts are the widgets, unchanged. Each person keeps their own arrangement for the session. The shipped dashboard has its own widget set (stats, jobs map, jobs by status, daily and labour cost) on a drag-and-resize grid; v2 applies the same idea to the designer's widgets.
- Tested in the browser: login (empty, wrong, lock-out, 2FA with all methods and wrong code, success), register (validation, duplicate email, wait, link, gate), forgot, reset (valid, mismatch, invite, expired, no params), verify, invitations (new, existing, invalid), session lock (wrong and right password), Google chooser, sign out, gate steps (phone, two-factor, company), states catalogue, first-run empties, 404, offline bar, dashboard customise (width, move, hide, show, drag, done, reset, per-person). Not tested: mobile width for auth, dark mode for auth.
- Also fixed on the way: the palette's links to people and customers pointed at routes that don't exist and silently landed on the dashboard.

### Auth screens: photo panel, phone width, dark mode (follow-up, 2026-10-07)
- **Left panel**: a site photo (`assets/auth-site.jpg`, 676x576) with the portal pinned to what is in it: the crane load to Assets (tower crane, test & tag, next inspection), the workers on the deck to Time clock (clocked in, inside the geofence), the tablet to Daily JSA (3 of 4 signed), the ute to Vehicles (with Liam Carter, rego valid). The headline stays "Everything on site, at a glance." Callouts are plain HTML on top of the image, sized with container units so they scale with the panel; the pin positions are in image pixels (`authShowcase()` in `js/views-auth.js`).
- **The photo is a stand-in.** It was cropped (Pillow) from the reference screenshot supplied in the session, because I can't source or generate photography. Replace the file with licensed or own photography and move the four pins to match. At 676px wide it will look soft on large or high-density screens.
- **Phone width**: the panel is replaced by a 150px photo header with the logo and headline; the card sits under it. No horizontal overflow on any auth screen; text links now have 40px tap targets.
- **Dark mode**: the photo panel keeps its dusk look in both themes; every auth screen passes a text contrast check (WCAG AA) in light and dark.
- **Short screens**: cards drop out below 700px of height; below 1180px of width the deck and ute callouts are hidden.
- **Bug found by this check**: the JSA builder's phone-preview frame used the class `phone`, which also styled every mobile-number field with a thick dark border (employee, customer, profile and register forms). Renamed the frame to `pvphone`.
- **Journeys on the photo**: a translucent road runs from the foreground to the horizon behind the site, with a glowing route line (animated dashes, still under reduced motion), perspective lane dashes, a destination pin at the horizon and a "Journeys: Enfield yard to Dubbo, 372 km, ETA 12:10" callout. It is an SVG drawn over the photo in `authShowcase()`; the road corners and `mid` curve are in image pixels, so they move with the pins if the photo is swapped. The callout hides below 1180px width; the road stays.
- **Road animation and leader lines (follow-up)**: the road's lane markings are blue dashes that travel up the road toward the white destination dot, getting thinner and fading as they reach it (`laneFrame()` in `js/views-auth.js`, driven by `requestAnimationFrame`; static under reduced motion). Every callout's white leader line is now measured from the real card box (`fitLeaders()`), so each line always runs from its pulsing dot to the nearest card edge and stays connected when the panel is resized or fonts load.
- **Dark mode check of the session lock and onboarding gate (2026-10-07)**: the session-expired screen passes a text contrast check in dark mode and covers the app (fixed, above the drawers); the gate banner passes in all three steps in light and dark. Found and fixed: the active step number (white on amber) had a contrast of 2.1 in both themes, now dark text on the amber and green markers; and the Security tab repeated the gate's "Set up now" banner while the gate was showing, so the duplicate is hidden during the gate.
- **Onboarding gate at phone width (2026-10-07)**: all three steps fit with no sideways scroll. Fixed: the banner squeezed its text beside the "Set up now" button, so on phones the text takes the full row and the button sits under it at 40px tall; the detail hero (profile, employee, customer, vehicle, asset, journey, company) crushed the name into a sliver beside the avatar and buttons, so on phones the text gets the row and the actions go full width underneath. Behaviour fixes found on the way: the mobile-number step now opens My profile on Personal details and scrolls to the mobile field (it opened on Security); the gate no longer pushes you back to its tab when you switch tabs; the "You're all set" toast only shows when the gate was really on (a persona change used to trigger it).
- **Gate in dark mode at phone width (2026-10-07)**: all three steps checked on screen and by contrast audit (gate banner, hero and sticky action bar): no failures, no sideways scroll, and nothing needed fixing. The mobile-number step lands on the empty Mobile field in dark mode as intended.

### Whole portal at phone width in dark mode (2026-10-07)
Checked about 55 routes at 375x812 in dark mode (every sidebar page, each detail and form page, auth screens, the gate, session lock) with an in-page audit: sideways overflow, text contrast (WCAG AA) and tap targets under 36px (hit areas extended with `::after` count). Also checked the nav drawer, a short-form drawer, a confirm dialog and a long error alert on screen, and the Employee persona's pages. After the fixes below, every route is clean.
- **Sideways scroll on Add asset and other forms**: the sticky action bar (`.fbar`) did not wrap, so long hints pushed the page wider than the phone. It now wraps, and form children can shrink (`.formpage>*{min-width:0}`).
- **Page header**: the title block and the action buttons shared one row and squeezed the title. On phones the title takes the row and the actions go full width underneath.
- **Banner eyebrow** (the small coloured word above the tagline) was 3:1 or less on some tones in dark mode; it now mixes the tone with the text colour.
- **Tap targets**: breadcrumbs, text links, "View all", toggles, day buttons, row menus, "Add" buttons, multiselect chip remove buttons, the "View role" link on an employee, and the auth footer and Demo-only links were all 17-30px tall. Small controls got an invisible hit area; the Demo-only links and auth footer got real 36px height.
- **Brand mark on the login photo**: white tile with `--brand-deep` text, which goes light in dark mode (3.8:1). Fixed to a fixed navy on the tile in both themes.
- **Known and left alone**: the multiselect's inner text input (`input.mq`) is 30px tall inside a taller box that is itself the tap target.
- **Overlays at phone width**: the short-form drawer is full screen with stacked footer buttons, the confirm dialog and a long (truncated) error alert both sit fully inside the viewport.

### Whole portal at tablet width in dark mode (2026-10-07)
Checked all 55 routes in dark mode at 768x1024 (iPad portrait), plus 820x1180, 1024x768 and 1180x820 (sidebar docked), the Employee persona, the sign-in screens, session lock, the three gate steps, the command palette, a drawer, a dialog and an error alert. Same audit as the phone pass (sideways overflow, WCAG AA text contrast, tap targets under 32px) plus a check for orphaned or gappy KPI rows. After the fixes below nothing fails. No page scrolled sideways and no text failed contrast at any tablet width, in dark mode.
- **Audit gotcha**: after switching theme, colour transitions are still running for the first reads and show fake contrast failures (a dashboard "1.1" on white-on-dark text). Disable transitions (`*{transition:none!important}`) before auditing a theme.
- **Tap targets at tablet width**: the phone pass only widened hit areas at 720px and below, so crumbs, text links, toggles, switches, chips, "Add" buttons, day buttons and map zoom were 17-30px tall on iPad. The invisible hit-area block now also applies at 1100px and below and on any touch screen (`pointer:coarse`), so an iPad in landscape with the sidebar docked gets it too. The `pointer:coarse` half can't be checked in the preview pane (it only fakes touch below 768px), the rules are the same ones verified at 768. Auth footer and Demo-only links got real 36px height up to 1100px.
- **KPI rows**: the designer's grid left one card alone on its row at tablet widths. Four-card rows (asset, company, job, journey, JSA, vehicle detail, customers, roles, time requests) now sit 2x2 from 761 to 910px and 4 across from 1101 to 1239px (the in-between widths already fit four). Five-card rows (dashboard and every list page) use the designer's three-over-two spans from 761px (it started at 861px), so the second row fills instead of leaving a gap.
- **Sign-in on small tablets** (561-900px): same single column as the phone, but a 220px photo header, 24px headline and a 500px card, instead of a phone-sized card floating on a tablet. Landscape (above 900px) keeps the photo panel with callouts and the road, and was checked at 1024.
- **Dead links**: the customer contact email (list and detail) was a `#` link that did nothing; now a real `mailto:` link.
- **Bug found by this check, not width-specific**: the command palette showed raw JavaScript source as the description of Scheduler and User management (their descriptions are functions), and long descriptions ran off the row and gave the list a sideways scrollbar. Descriptions are now evaluated, and truncate with an ellipsis (shorter on phones).
- **Bug found by this check, not width-specific**: the palette's "Onboarding gate" previews only broke their own step, so previewing "two-factor" or "company details" after another preview (or after "mobile number") stayed on the mobile-number step. Each preview now starts from someone who has finished the other steps.
- **Known and left alone**: the multiselect's inner input (30px, its box is the target) and the JSA approver select (the audit measures its inline wrapper label, the select itself is 36px) are false positives. The scheduler's seven-day grid scrolls sideways inside its card by design (Thursday is cut off as the cue). Behind the session-lock screen the page's own scrollbar is still visible at the edge.
