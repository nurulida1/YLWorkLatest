# Employee Leave Module — Scope Tracker

Integrated into **YLWorkLatest** (not a standalone `LeaveManagementSystem` solution).  
Uses existing `User`, JWT auth, `Notification` + SignalR, PrimeNG + Tailwind, MySQL via `AppDbContext`.

## Architecture decisions (confirmed)

| Topic | Choice |
|--------|--------|
| Integration | YLWork monolith (`backend/` + `frontend/`) |
| Employee entity | `Users` table — all FKs → `User.Id` |
| **Leave approver chain** | **`User.HodId` only** — `User.ManagerId` is **not** used for leave routing |
| Roles | `User.SystemRole` — Employee: Staff/Executive/Support; Manager: HOD/Manager/Management; HR; Admin: SuperAdmin/Admin |
| Auth | Existing login — no separate leave auth |
| Notifications | Reuse `Notifications` with `Type = Leave.*`, `LeaveRequestId`, SignalR `ReceiveNotification` |
| Email | **On hold** — MailKit not wired |
| UI | PrimeNG only, routes under `/leave/*` |

### HOD approval chain (current behaviour)

1. Employee submits leave → first approver is **`employee.HodId`** (must be set on profile).
2. When that HOD **approves**:
   - If they have **`User.HodId`** → request stays **Pending**, next approver is their HOD (notification sent).
   - If they have **no `User.HodId`** → request becomes **Approved**, balance deducted.
3. Any HOD in the chain may **reject** while they are the current approver (mandatory reason). Pending balance is restored; the employee must **submit a new leave application** if they still need leave.
4. Chain stops when an approver without a `HodId` gives final approval.

```
Employee (HodId → A) → A approves → (A.HodId → B) → B approves → (B.HodId → C) → C approves (no HodId) → Approved
```

**Rejected leave:** no appeal, no HR escalation. `LeaveAppeal` / `Escalated` status are legacy only (not used in new submissions).

---

## MVP (v1) — implemented

### Backend
- [x] Domain entities under `Model/Leave/` (LeaveType, LeaveBalance, LeaveRequest, LeaveApproval, LeaveCancellation, LeaveConflictCheck, LeaveBalanceCheckRecord, LeaveSupportingDocument, LeaveAppeal)
- [x] Enums + `LeaveRoles` helper
- [x] `User.HodId` for leave approval chain (`User.ManagerId` column exists but is unused by leave module)
- [x] `Notification.LeaveRequestId`
- [x] EF configuration + migration `AddLeaveManagementModule`
- [x] Services: `LeaveRequestService`, `LeaveBalanceService`, `LeavePolicyService`, `LeaveConflictService`, `LeaveNotificationHelper`, `EmergencyLeaveApprovalScheduler`, `LeaveYearEndHostedService`
- [x] Controllers: `LeaveRequests`, `LeaveTypes`, `LeaveBalance`, `LeavePolicy`
- [x] Dev seed: `LeaveDbSeeder.SeedAsync` (types + policy bands, Replacement, settings modules, test users with HodId chain, balances, sample cases)
- [x] Production seed: `LeaveDbSeeder.EnsureBasicsAsync` on startup (default leave policy + leave types only; no demo users/requests)
- [x] Emergency auto-approve after configurable delay (`Leave:EmergencyAutoApproveMinutes`, default 120)
- [x] HOD-chain approve/reject + `GET pending/hod/{hodId}`

### Frontend
- [x] Models + services (`leave-request`, `leave-balance`, `leave-type`)
- [x] Routes: `/leave` (dashboard), `/leave/apply`, `/leave/apply/:id` (edit pending), `/leave/history`, `/leave/:id`, `/leave/approvals`
- [x] Sidemenu entries (role-gated)
- [x] Apply form (balance display, leave type flags, document upload; Replacement only when credited remaining > 0)
- [x] Leave dashboard (`/leave`) — KPI cards, per-type balance grid, status chips, recent requests, HOD approval preview, Team calendar tab
- [x] History table (edit pending, status labels)
- [x] Detail (cancel, view document; rejected → link to new application)
- [x] HOD approvals queue (approve/reject with reason, document link)
- [x] Admin leave types CRUD (`/settings/leave-types`) — SuperAdmin / Admin / HR
- [x] Admin leave policy (`/settings/leave-policy`) — tenure bands, carry %, grant Replacement, run year-end

### Flow cases (seed / logic)

| Case | Description | Status |
|------|-------------|--------|
| 1 | Approved leave, balance deducted | Seed + API |
| 2 | Rejected + mandatory reason; employee submits **new** leave application (no appeal) | Seed + API |
| 3 | Cancel before start → auto-cancel, restore balance | API |
| 4 | Insufficient balance → blocked with options in response | API |
| 5 | Emergency → notify first HOD; auto-approve after 2h | API + scheduler |
| 6 | Conflict warning + employee override | API |
| 7 | Multi-level HOD approval via `User.HodId` chain | API |

---

## Leave policy (entitlement rules)

**Tenure** (calendar years of service): `tenureYears = balanceYear - JoinedDate.Year` (null join date → 0).

| Tenure years | Annual | Medical (MC) |
|---|---|---|
| `< 2` (0, 1) | 8 | 14 |
| `>= 2` and `< 5` | 12 | 18 |
| `>= 5` | 15 | 22 |

**Annual carry-forward** (auto on/after 1 Jan via `LeaveYearEndHostedService`, or `POST /LeaveBalance/run-year-end`):

Use-it-or-lose-it on `AnnualCarryForwardPercent` of **that year’s tenure entitlement** (not a max carry cap):

```
mustUseOrLose = (annualCarryForwardPercent / 100) * TenureEntitledDays
forfeit = max(0, mustUseOrLose - UsedDays)   // approved/used only; pending ignored
carry = max(0, RemainingDays - forfeit)      // can exceed mustUseOrLose
nextEntitled = nextYearTenureEntitlement + carry
```

Example (tenure 15, 50% → must use/lose 7.5): unused 15 → carry 7.5 (total 22.5); used 7.5 remaining 15 → carry 15 (total 30).

**Medical**: tenure bands only; no carry.  
**Replacement**: credited only; unused forfeited at year-end; no carry.

**Fixed types** (Emergency, Unpaid, etc.): `DefaultDaysPerYear` from leave-type admin.

**Replacement Leave**: HR/Admin credit via `POST /LeaveBalance/credit`; usable only in the credit year; unused forfeited at year-end.

**Policy edits**: apply from `EffectiveFromYear` / next calendar year — existing year balances are not rewritten mid-year.

**Balance creation**: `EnsureYearBalancesAsync` on dashboard/balance GET (policy-driven for Annual/MC).

`LeaveBalance` breakdown: `TenureEntitledDays`, `CarriedForwardDays`, `CreditedDays`; `EntitledDays` is the usable pool; `RemainingDays = EntitledDays - UsedDays - PendingDays`.

System modules: `settings-leave-types`, `settings-leave-policy`, `settings-leave-calendar-sync` (seeded for SuperAdmin / Admin / HR).

**Gender restriction:** Leave types have `ApplicableGender` (`All` | `Male` | `Female`). Existing types default to `All`. Dashboard/apply only show eligible types; balances are not created for ineligible genders; apply API rejects mismatches. Orphan balances (if any) stay in DB but are hidden.

### Google Calendar sync (HR)

HR connects a **personal Gmail** account at `/settings/leave-calendar-sync`. YLWork creates a dedicated calendar **YLWork Company Leave** and pushes **approved** company-wide leave as all-day events.

| Event title | Rule |
|-------------|------|
| `{Name} — {LeaveType}` | Annual, Emergency, Replacement, etc. |
| `{Name} — On leave` | `LeaveType.PolicyKind == MedicalTenure` only |

- **Create:** final approval (`FinalizeApprovalAsync`) or emergency auto-approve
- **Delete:** cancel approved leave before start date
- **Near real-time:** background sync after DB commit (does not block API)

**Google Cloud setup (once per environment):**

1. Create OAuth client (Web) in Google Cloud Console
2. Enable Google Calendar API
3. Redirect URI: `https://localhost:5000/api/LeaveCalendarSync/google/callback` (or prod URL)
4. Set `GoogleCalendar:ClientId` and `ClientSecret` in `appsettings.json`

OAuth tokens stored encrypted via ASP.NET Data Protection (`LeaveCalendarTokens`).

### Outlook calendar sync (HR) — ICS subscribe

For **IMAP/SMTP Outlook desktop** (no Microsoft 365 mailbox), Microsoft Graph push is not possible. YLWork provides a **per-user ICS feed** instead:

1. HR enables feed at `/settings/leave-calendar-sync` → **Enable Outlook feed**
2. Copy the subscribe URL
3. Outlook → Add calendar → From Internet → paste URL

| Topic | Detail |
|-------|--------|
| Auth | Secret token in URL (anonymous GET); rotate/disable invalidates old URL |
| Content | Same title rules as Google; approved leave only; past 30 days + future |
| Refresh | **Not near real-time** — Outlook polls on its schedule (often 30+ minutes) |
| Config | `LeaveCalendar:IcsBaseUrl` (e.g. `https://localhost:5000`) |
| Graph / M365 | Deferred until a real Microsoft-hosted mailbox is available |

Google and Outlook can both be connected for the same HR user.

---

## v2 — not yet built

- [x] Leave dashboard summary cards (balance, pending, approved counts) — `/leave`
- [x] Team calendar on leave dashboard (`/leave` → Team calendar tab) — company-wide approved leave, role-based privacy
- [x] Google Calendar sync for HR (`/settings/leave-calendar-sync`) — OAuth push to personal Gmail; Medical redacted as "On leave"
- [x] Outlook ICS subscribe feed for IMAP/desktop (`/settings/leave-calendar-sync`) — not near real-time; Graph deferred
- [x] Admin settings UI: leave types CRUD (`/settings/leave-types`)
- [x] Admin leave policy UI (`/settings/leave-policy`)
- [ ] HR reports (`/hr/reports`)
- [ ] Admin employees leave setup (`/settings/employees`) — assign `HodId`
- [ ] Cancellation approval when leave already started (HOD approves `LeaveCancellation`)
- [ ] Dedicated conflict/balance preview endpoints (pre-submit)
- [ ] MailKit email channel
- [ ] SMS channel
- [ ] Role guard on Angular routes (currently menu + API `[Authorize]` only) — partial: `modulePermissionGuard` on leave + settings routes
- [ ] Shared UI: status badge, balance card, conflict banner, notification dropdown filter for `Leave.*`

---

## API reference (base: `/api`)

| Method | Route | Roles |
|--------|-------|-------|
| GET | `/LeaveTypes` | Authenticated |
| POST/PUT | `/LeaveTypes`, `/LeaveTypes/{id}` | SuperAdmin, Admin, HR |
| GET | `/LeavePolicy` | Authenticated |
| PUT | `/LeavePolicy` | SuperAdmin, Admin, HR |
| GET | `/LeaveBalance/{employeeId}`, `.../{year}` | Authenticated (ensures year balances first) |
| POST | `/LeaveBalance/credit` | SuperAdmin, Admin, HR (Replacement only) |
| POST | `/LeaveBalance/run-year-end?year=` | SuperAdmin, Admin, HR (closes year; idempotent) |
| GET | `/LeaveRequests` | Authenticated |
| GET | `/LeaveRequests/calendar?from=&to=&departmentId=&leaveTypeId=` | Authenticated (approved only; type/reason for CanApprove roles) |
| GET | `/LeaveRequests/{id}` | Authenticated |
| POST | `/LeaveRequests` | Can apply roles |
| PUT | `/LeaveRequests/{id}` | Can apply roles (pending only) |
| POST | `/LeaveRequests/{id}/approve` | HOD, Manager, HR, Admin |
| POST | `/LeaveRequests/{id}/reject` | HOD, Manager, HR, Admin |
| POST | `/LeaveRequests/{id}/cancel` | Authenticated |
| POST | `/LeaveRequests/{id}/document` | Authenticated |
| GET | `/LeaveRequests/pending/hod/{hodId}` | HOD, Manager, HR, Admin |
| GET | `/LeaveRequests/pending/manager/{id}` | Legacy alias → same as `pending/hod` |
| GET | `/LeaveCalendarSync/status` | SuperAdmin, Admin, HR |
| GET | `/LeaveCalendarSync/google/connect-url` | SuperAdmin, Admin, HR |
| GET | `/LeaveCalendarSync/google/callback` | Anonymous (OAuth redirect) |
| POST | `/LeaveCalendarSync/google/disconnect` | SuperAdmin, Admin, HR |
| POST | `/LeaveCalendarSync/google/resync` | SuperAdmin, Admin, HR |
| POST | `/LeaveCalendarSync/outlook/ics/enable` | SuperAdmin, Admin, HR |
| POST | `/LeaveCalendarSync/outlook/ics/rotate` | SuperAdmin, Admin, HR |
| POST | `/LeaveCalendarSync/outlook/ics/disable` | SuperAdmin, Admin, HR |
| GET | `/LeaveCalendarSync/outlook/ics/{token}.ics` | Anonymous (token secret) |

Balance DTO includes `tenureEntitledDays`, `carriedForwardDays`, `creditedDays`, `policyKind`.  
Response DTO includes `currentApproverId` / `approvalChain` for pending requests.

---

## Dev setup

1. **Stop** running `dotnet run` if the build reports file lock on `YLWorks.exe`.
2. Apply migrations — see **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** for the full team workflow. Short version:
   ```bash
   cd YLWorkLatest/backend
   dotnet build
   dotnet ef database update
   dotnet run -lp https
   ```
3. Seed runs automatically in **Development** on startup (`EnsurePolicyAndKinds` + settings modules always; sample leave requests skipped if `LeaveTypes` already exist).
4. Test accounts (seeded when missing):

   | Email | Password | Role | HodId chain (leave) |
   |-------|----------|------|---------------------|
   | leave.admin@ylwork.local | Admin123! | Admin | — |
   | leave.hr@ylwork.local | Hr123! | HR | — |
   | leave.manager2@ylwork.local | Manager123! | HOD (top) | none |
   | leave.manager1@ylwork.local | Manager123! | Manager | → manager2 |
   | leave.emp1@ylwork.local | Staff123! | Staff | → manager1 → manager2 |

   Example: emp1 submit → manager1 approves → forwards to manager2 → manager2 approves (final).

5. For faster emergency testing, add to `appsettings.Development.json`:
   ```json
   "Leave": { "EmergencyAutoApproveMinutes": 2 }
   ```

6. Frontend: `cd YLWorkLatest/frontend && npm start`

---

## Files added (main)

**Backend:** `Model/Leave/*`, `Services/Leave/*` (incl. `LeavePolicyService`, `LeaveYearEndHostedService`, `GoogleCalendar*`, `OutlookLeaveIcsFeedService`, `LeaveExternalCalendarSyncCoordinator`), `Controller/Leave*.cs`, `Controller/LeaveCalendarSyncController.cs`, `Data/LeaveDbSeeder.cs`, `Migrations/*LeavePolicy*`, `Migrations/*LeaveCalendarSync*`  
**Frontend:** `components/leave/*`, `components/settings/leave-types`, `leave-policy`, `leave-calendar-sync`, `models/Leave.ts`, `services/leave-*.ts`  
**Docs:** this file

---

*Last updated: Outlook ICS subscribe for IMAP/desktop; Google OAuth push unchanged.*
