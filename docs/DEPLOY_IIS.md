# Deploy YL Work on IIS (on-prem) + Cloudflare

One IIS site serves the Angular SPA and the .NET 9 API (same origin). MySQL runs on the same Windows Server. JasperReports is out of scope.

Architecture:

- Browser → `http://<LAN-IP>/` (Phase 1) or `https://YOUR_HOSTNAME/` via Cloudflare (Phase 2)
- IIS (ASP.NET Core Module) → `YLWorks.dll`
- Static SPA in `wwwroot/`
- API under `/api/*`, SignalR at `/hubs/notifications`, files under `/uploads` (and legacy `/Uploads`)
- MySQL on `localhost:3306`

Use the publish script: [`scripts/Publish-YLWork.ps1`](../scripts/Publish-YLWork.ps1).

---

## Prerequisites (build machine)

- Node.js 20+ and npm
- .NET 9 SDK
- PowerShell 5.1+ (or 7+)

Production `ng build` budgets are sized for the current bundle (~1.55 MB initial). If a future build fails on budgets, adjust `frontend/angular.json` production `budgets` before publishing.

---

## Phase 1 — Windows Server install (LAN only)

### 1. Roles and runtimes

1. Install **IIS** with:
   - ASP.NET / common HTTP features as needed
   - **WebSocket Protocol** (required for SignalR)
2. Install the **[.NET 9 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/9.0)** (includes ASP.NET Core Module V2).
3. Run `iisreset` after the hosting bundle install.
4. Install **[MySQL 8](https://dev.mysql.com/downloads/mysql/)** on this server (Windows → MySQL Installer / MSI). Prefer **8.0.x** LTS.
5. Create database and app user (do not expose MySQL to the internet).

Run these in **MySQL Workbench** or `mysql` CLI **on the Windows Server**:

```sql
CREATE DATABASE yl_works CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ylworks'@'localhost' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON yl_works.* TO 'ylworks'@'localhost';
FLUSH PRIVILEGES;

-- user that can access from any host
CREATE USER 'ylworks'@'%' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON yl_works.* TO 'ylworks'@'%';
FLUSH PRIVILEGES;

-- from one pc
CREATE USER 'ylworks'@'192.168.1.50' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON yl_works.* TO 'ylworks'@'192.168.1.50';
FLUSH PRIVILEGES;

-- from lan subnet
CREATE USER 'ylworks'@'192.168.1.%' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON yl_works.* TO 'ylworks'@'192.168.1.%';
FLUSH PRIVILEGES;
```

What `'ylworks'@'localhost'` means:

- MySQL users are `username` + **where they connect from**.
- `@'localhost'` = this account may connect **only from the same machine** (the Windows Server).
- That is what we want: IIS/the API on this server talks to MySQL as `server=localhost;...user outsiders cannot log in as `ylworks` over the network.
- You do **not** need VS Code for this step — only MySQL tools on the server.
- Do **not** open MySQL port `3306` on the firewall to the internet.

### 2. Site folders

Suggested layout:

```text
C:\inetpub\ylwork\           ← IIS site physical path (publish output)
C:\inetpub\ylwork\wwwroot\   ← Angular files (created by publish)
C:\inetpub\ylwork\uploads\   ← persistent user files (never delete on deploy)
C:\inetpub\ylwork\logs\      ← stdout logs from web.config
```

Create the empty folders if they do not exist yet (`wwwroot` can wait until first publish).

### 3. IIS site + folder permissions

#### 3a. Create the Application Pool

1. Open **IIS Manager** (`inetmgr`).
2. Left tree → **Application Pools** → **Add Application Pool…**
3. Name it e.g. `YLWork`.
4. **.NET CLR version:** **No Managed Code**
5. Pipeline: **Integrated** → OK

#### 3b. Grant Modify on `uploads\` and `logs\`

The site runs as the App Pool identity (`IIS AppPool\<PoolName>`), not your Windows login. It needs write access for uploads and stdout logs.

**GUI (File Explorer on the Windows Server):**

1. Open `C:\inetpub\ylwork`.
2. Right-click **`uploads`** → **Properties** → **Security** → **Edit…** → **Add…**
3. Click **Locations…** → select the **local computer** (this server’s name) → OK.
4. Under “Enter the object names to select”, type (use your pool name):

   ```text
   IIS AppPool\YLWork
   ```

5. Click **Check Names** (the name should underline) → OK.
6. Select that entry → under **Allow**, tick **Modify** → OK → OK.
7. Repeat steps 2–6 for the **`logs`** folder.

If **Check Names** fails, the App Pool was not created yet or the name is wrong — finish §3a first.

**Optional (PowerShell as Administrator):**

```powershell
icacls "C:\inetpub\ylwork\uploads" /grant "IIS AppPool\YLWork:(OI)(CI)M" /T
icacls "C:\inetpub\ylwork\logs" /grant "IIS AppPool\YLWork:(OI)(CI)M" /T
```

#### 3c. Create the Website

1. In IIS Manager → **Sites** → **Add Website…**
2. Site name: e.g. `YLWork`
3. Application pool: select **`YLWork`** (the pool from §3a)
4. Physical path: `C:\inetpub\ylwork`
5. Binding: HTTP, port **80**, host name empty (or internal name) for LAN pilot → OK
6. Confirm **WebSockets** are enabled (Windows Features / IIS → site → Configuration Editor → `system.webServer/webSocket`).
7. Environment is already set in repo `web.config`: `ASPNETCORE_ENVIRONMENT=Production`.

Optional IIS environment variables (preferred for secrets instead of editing JSON on disk):

| Name | Example |
|------|---------|
| `ConnectionStrings__DefaultConnection` | `server=localhost;port=3306;database=yl_works;user=ylworks;password=...;` |
| `Jwt__Key` | long random secret (32+ bytes hex/base64) |
| `Jwt__Issuer` | `http://192.168.x.x` (LAN) then later `https://YOUR_HOSTNAME` |
| `Jwt__Audience` | same as Issuer |

### 4. First publish + migrate

On a build machine (or on the server if tools are installed):

```powershell
cd <repo>\YLWorkLatest
.\scripts\Publish-YLWork.ps1
```

Copy `artifacts\publish\*` to `C:\inetpub\ylwork`, **keeping** any existing `uploads\` folder.

Edit `C:\inetpub\ylwork\appsettings.Production.json` (or set env vars above):

- Connection string
- New JWT key (do not reuse the committed development key)
- For LAN: set `Jwt:Issuer` / `Jwt:Audience` to `http://<server-lan-ip>` (or leave hostname placeholders and override via env)
- Leave `EnableHttpsRedirection` as `false` until HTTPS is configured

#### Apply database schema (migrations)

Because MySQL only allows `ylworks@localhost`, schema updates must run **against MySQL on the server** (as `server=localhost`). The server does **not** need VS Code. Prefer generating a SQL script on your **dev/build PC**, then run that script on the server.

**Option A — recommended (no repo / no `dotnet ef` on the server)**

On your **dev PC** (where the repo and .NET SDK already exist):

```powershell
cd <repo>\YLWorkLatest\backend
dotnet ef migrations script --idempotent -o ..\artifacts\yl_works_schema.sql

# Strip UTF-8 BOM — MySQL Workbench fails with Error 1064 on the invisible ﻿ before CREATE
$path = "..\artifacts\yl_works_schema.sql"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $path), [System.IO.File]::ReadAllText((Resolve-Path $path)), $utf8NoBom)
```

Copy `artifacts\yl_works_schema.sql` to the Windows Server. On the server, apply it with **MySQL Workbench** (File → Run SQL Script) — easiest — or from PowerShell:

```powershell
# PowerShell does not support "<" redirection. Use Get-Content | mysql:
Get-Content C:\temp\yl_works_schema.sql -Raw | mysql -u ylworks -p yl_works
```

`-p` with a space after it **prompts** for the password (do not put the password on the same token as another argument).  
Or open **cmd.exe** and run:

```bat
mysql -u ylworks -p yl_works < C:\temp\yl_works_schema.sql
```

**Option B — run EF on the server (needs SDK + a copy of `backend`)**

Only if you install the [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) on the server (Hosting Bundle alone is not enough for `dotnet ef`) and copy at least the `backend` project folder:

```powershell
cd C:\temp\YLWorkLatest\backend
dotnet tool install --global dotnet-ef   # once
$env:ConnectionStrings__DefaultConnection = "server=localhost;port=3306;database=yl_works;user=ylworks;password=YOUR_PASSWORD;"
dotnet ef database update
```

You cannot run `dotnet ef database update` from your laptop against this MySQL using `ylworks@localhost` — that user is rejected for remote connections. Do not create `@'%'` users or open `3306` publicly just to migrate from your PC.

After schema + publish files are in place, start the IIS site. Open `http://<server-lan-ip>/health` then the SPA at `http://<server-lan-ip>/`.

### 5. LAN validation checklist

- [ ] Login works
- [ ] API calls succeed (browser Network tab shows `/api/...` same host)
- [ ] Deep link refresh works (e.g. open `/dashboard` and F5) — SPA fallback
- [ ] Notifications / SignalR connect (`/hubs/notifications`)
- [ ] Upload and download an attachment
- [ ] App Pool recycle does not delete `uploads\`

### 6. Redeploy (preserve uploads + Production settings)

On the server (PowerShell as admin), after building elsewhere and syncing the repo or using `-SitePath`:

```powershell
.\scripts\Publish-YLWork.ps1 -SitePath 'C:\inetpub\ylwork' -IisSiteName 'YLWork'
```

The script backs up non-upload files, robocopies the new build while excluding `uploads\`, and restores an existing `appsettings.Production.json`.

Rollback: copy the timestamped `ylwork-backup-*` folder next to the site back over the site path (still leave `uploads\` alone if the backup skipped it).

---

## Phase 2 — Cloudflare + public HTTPS

Do this only after LAN sign-off.

### 1. DNS

In Cloudflare DNS for your zone:

- Type **A** (or AAAA): name `ylwork` (or `@` / your chosen host) → server **public** IP
- Proxy status: **Proxied** (orange cloud)

### 2. SSL/TLS mode

In Cloudflare → SSL/TLS:

- Set encryption mode to **Full (strict)** — do **not** use Flexible
- Create a **Cloudflare Origin Certificate** (or use another public cert) and bind it in IIS for HTTPS :443 with host name `YOUR_HOSTNAME`

### 3. Firewall / router

- Allow inbound **443** (and **80** only for HTTP→HTTPS redirect if desired) to the Windows Server
- Keep MySQL (**3306**) closed to the internet
- Prefer restricting management (RDP) to VPN/LAN

### 4. App settings cutover

Update Production config / IIS env vars:

| Setting | Value |
|---------|--------|
| `Jwt__Issuer` | `https://YOUR_HOSTNAME` |
| `Jwt__Audience` | `https://YOUR_HOSTNAME` |
| `GoogleCalendar__RedirectUri` | `https://YOUR_HOSTNAME/api/LeaveCalendarSync/google/callback` |
| `GoogleCalendar__FrontendBaseUrl` | `https://YOUR_HOSTNAME` |
| `LeaveCalendar__IcsBaseUrl` | `https://YOUR_HOSTNAME` |
| `EnableHttpsRedirection` | `true` (optional once IIS has a working HTTPS binding) |

No frontend rebuild is required for hostname changes: production uses relative `/api` and `/hubs/notifications`.

Recycle the App Pool. Confirm:

- [ ] `https://YOUR_HOSTNAME/health`
- [ ] Login over HTTPS
- [ ] SignalR still connects through Cloudflare (WebSockets)
- [ ] File upload/download

### 5. Cloudflare extras (recommended)

- Enable WebSockets (Cloudflare Network) if not already on
- Basic WAF / bot fight as appropriate for an internal business app exposed publicly
- Optional: Cloudflare Access / IP allowlist if only certain offices should reach the app

---

## Secrets hygiene

- Repo `appsettings.json` may still contain local/dev values — treat them as compromised for production; **rotate** JWT key and DB password on the server.
- Prefer IIS environment variables or a server-only `appsettings.Production.json` that is never committed with real secrets.
- SMTP / Google Calendar can stay empty until those features are needed.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| 500.19 / `0x8007000d` on `web.config` | Hosting Bundle missing **or** installed before IIS (Repair the Bundle), **or** invalid/extra entries in `web.config`. Use the minimal `web.config` from the repo; enable WebSockets via Windows Features (not required in `web.config`). |
| 500.30 | App failed to start; check `logs\stdout` and connection string / JWT in Production settings |
| SPA blank, API works | Angular not copied into `wwwroot` |
| Refresh on deep link 404 | `MapFallbackToFile` missing or static files not served |
| SignalR fails | WebSockets disabled in IIS or blocked by proxy |
| Attachments 404 | App Pool cannot read `uploads\`, or wrong path casing on non-Windows |
| CORS errors in production | Should not appear for same-origin; ensure you are not loading an old build that still points at another host |

Out of scope: JasperReports Docker compose, separate API subdomain, CI/CD pipelines.
