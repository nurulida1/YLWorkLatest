# Database migrations — team guide (YLWorkLatest)

How to keep **MySQL**, **EF Core migrations**, and **C# models** in sync when multiple developers work on the same repo.

This project uses:

- **Backend:** `YLWorkLatest/backend` (.NET 9, EF Core 9, Pomelo MySQL)
- **DbContext:** `AppDbContext`
- **Migrations folder:** `backend/Migrations/`
- **History table:** `__EFMigrationsHistory` in your database

Each developer should use their **own local database** (or a dedicated dev DB). Never share one mutable dev DB without coordination — that is the main source of “Unknown column” runtime errors.

---

## Golden rules (read first)

1. **Migration files are shared via Git** — commit and pull them like code.
2. **Database state is local** — after `git pull`, run `dotnet ef database update` on your machine.
3. **Never edit an old migration** that another developer may already have applied. Add a **new** migration instead.
4. **Never no-op or comment out** a migration’s `Up()` method to “fix” a failed apply without team agreement. That marks the migration as applied while the schema change never ran (this caused `DeliveryOrderRMANo` / `InventoryId` errors in this project).
5. **Stop the API** before building or migrating (`Ctrl+C` on `dotnet run`). A running app locks `YLWorks.exe` and GemBox native files.
6. **One migration per logical schema change** — small, reviewable, named clearly (e.g. `AddLeaveBalanceIndex`, not `SyncPendingModelChanges` with an empty `Up()`).

---

## Prerequisites

| Tool | Notes |
|------|--------|
| [.NET 9 SDK](https://dotnet.microsoft.com/download) | Project targets `net9.0` |
| MySQL 8.x | Local or Docker |
| EF CLI | Installed with the project (`Microsoft.EntityFrameworkCore.Tools`) |

Verify EF tools:

```bash
cd YLWorkLatest/backend
dotnet ef --version
```

---

## Connection string (each developer)

Default connection is in `appsettings.json`. Override locally in **`appsettings.Development.json`** (do not commit personal passwords if your team uses secrets):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=yl_works_dev;user=YOUR_USER;password=YOUR_PASSWORD;"
  }
}
```

Use a **database name per developer** (e.g. `yl_works_syukri`, `yl_works_ali`) so experiments do not break each other.

Create the empty database once:

```sql
CREATE DATABASE yl_works_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## First-time setup (new developer)

```bash
cd YLWorkLatest/backend

# 1. Restore packages
dotnet restore

# 2. Build (must succeed before EF)
dotnet build

# 3. Apply all migrations to your empty DB
dotnet ef database update

# 4. Run API (Development seeders run on startup where configured)
dotnet run -lp https
```

Confirm migrations applied:

```bash
dotnet ef migrations list
```

Every migration should appear **without** `(Pending)` at the end.

---

## Daily workflow — after `git pull`

When someone else merged migration files:

```bash
cd YLWorkLatest/backend

# Stop dotnet run if it is running

dotnet build
dotnet ef migrations list          # see if anything is (Pending)
dotnet ef database update        # apply new migrations
dotnet run -lp https
```

If `dotnet ef database update` says **“No migrations were applied. The database is already up to date”**, you are caught up.

---

## Creating a migration (author workflow)

When you change entities (`Model/`), `AppDbContext`, or fluent configuration:

### 1. Stop the running API

### 2. Ensure the model builds

```bash
dotnet build
```

### 3. Check for unpersisted model changes

```bash
dotnet ef migrations has-pending-model-changes
```

- Exit code **0** → model matches the latest snapshot; safe to proceed or nothing to migrate.
- Exit code **1** → you need a new migration.

### 4. Add a migration

Use a **descriptive name** tied to the feature:

```bash
dotnet ef migrations add AddUserRejectReason
```

Review the generated file under `Migrations/`:

- Does `Up()` match what you intended?
- No accidental drops of tables/columns?
- No empty `Up()` unless intentionally a no-op (avoid no-ops).

### 5. Apply locally and test

```bash
dotnet ef database update
dotnet run -lp https
```

Exercise the feature that uses the new columns/tables.

### 6. Commit to Git

Commit **both**:

- `Migrations/<timestamp>_<Name>.cs`
- `Migrations/<timestamp>_<Name>.Designer.cs`
- Updated `Migrations/AppDbContextModelSnapshot.cs`

**PR checklist for migration PRs:**

- [ ] Migration name describes the change
- [ ] `Up()` is not empty (unless team-approved)
- [ ] Tested on a clean local DB (`database update` from scratch or fresh DB)
- [ ] No hand-edits to old migration files
- [ ] Teammates notified in PR description: “Run `dotnet ef database update` after merge”

---

## What teammates do when you merge a migration

```bash
git pull
cd YLWorkLatest/backend
dotnet build
dotnet ef database update
```

No manual SQL should be required if migrations are correct.

---

## Troubleshooting

### Build failed during `dotnet ef database update`

**Symptom:** `Build failed. Use dotnet build to see the errors.`

**Common causes on this repo:**

| Cause | Fix |
|-------|-----|
| API still running | Stop `dotnet run`, then retry |
| `DiscoverPrecompressedAssets` / duplicate wwwroot asset | `YLWorks.csproj` sets `<DisableBuildCompression>true</DisableBuildCompression>` — ensure you are on latest main |
| GemBox file lock (`chrome.exe`) | Stop API; kill stray `YLWorks.exe` / headless `chrome.exe` if needed; rebuild |

Always run:

```bash
dotnet build
```

and fix compile errors before retrying EF.

---

### `Unknown column 'X' in 'field list'` at runtime

**Meaning:** C# model expects column `X`, but your MySQL table does not have it.

**Usual cause:** Schema drift — migration history says “applied” but the DDL never ran (partial apply, no-op migration, or manual DB edits).

**Do not** only patch your DB with SQL and forget the team. Fix the process:

1. Compare model vs DB:

   ```sql
   SHOW COLUMNS FROM ProductServices;
   SHOW COLUMNS FROM DeliveryOrderRMAs;
   ```

2. Check whether a migration was supposed to add/rename the column (search `Migrations/` for the column name).

3. **Team fix:** add a **new** migration that performs the missing change idempotently, or restore from backup and re-run migrations on a fresh DB.

4. **Prevention:** never comment out `Up()` steps on shared migrations; never mark migrations applied manually in `__EFMigrationsHistory` unless the whole team agrees.

Examples seen in this project:

| Error | Expected migration / change |
|-------|-----------------------------|
| `Unknown column 'd.DeliveryOrderRMANo'` | `AddPORMA` renames `RMANo` → `DeliveryOrderRMANo` |
| `Unknown column 'p.InventoryId'` | `UpdateAllTables` adds `InventoryId` on `ProductServices` |

---

### `The model has pending changes. Add a new migration`

**Meaning:** Your entities/DbContext differ from `AppDbContextModelSnapshot.cs`.

**Fix (author):**

```bash
dotnet ef migrations add <DescriptiveName>
dotnet ef database update
```

Commit the new migration files.

**If you did not change the model:** someone may have edited the snapshot without committing, or you are on a mixed branch — align with `git pull` and rebuild.

---

### `ProductService.InventoryId1` shadow property warning

EF created a shadow FK because `InventoryId` conflicts with another relationship mapping. Not fatal, but indicates messy inventory mapping. When touching inventory/product code, consider cleaning up `AppDbContext` + `ProductService` so only one inventory relationship exists.

---

### Migration failed halfway

1. **Do not** delete rows from `__EFMigrationsHistory` alone.
2. Note the failing SQL from the console.
3. Discuss with the team:
   - Fix forward with a new migration, or
   - Restore DB from backup / recreate local DB and run `dotnet ef database update` from scratch.

**Nuclear option for local dev only** (destroys local data):

```sql
DROP DATABASE yl_works_dev;
CREATE DATABASE yl_works_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
dotnet ef database update
```

---

### `dotnet clean` did not fix weird build errors

Delete `backend/obj` and rebuild. SDK 9.0.300 can leave stale static web asset cache files:

```bash
rm -rf obj bin    # Git Bash / macOS / Linux
dotnet restore
dotnet build
```

On Windows PowerShell: `Remove-Item -Recurse -Force obj, bin`

---

## Verifying database health

```bash
# All migrations applied?
dotnet ef migrations list

# Model matches snapshot?
dotnet ef migrations has-pending-model-changes

# What EF thinks is applied (MySQL)
SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId;
```

After update, smoke-test modules that recently changed schema (leave, product services, delivery RMA, etc.).

---

## Team conventions summary

| Do | Don't |
|----|--------|
| Pull → build → `database update` daily | Share one writable dev DB without coordination |
| Add new migrations for schema changes | Change entities without a migration |
| Use clear migration names | Empty `Up()` to silence errors |
| Commit migration + snapshot together | Edit migrations already on main |
| Stop API before EF commands | Run `database update` while `dotnet run` is active |
| Use personal/local database names | Manually alter shared DB without a migration |
| Describe migration steps in PR | Apply one-off SQL only on your machine |

---

## Quick reference

```bash
cd YLWorkLatest/backend

dotnet ef database drop --force # to drop the database/ fresh start
dotnet build
dotnet ef migrations list
dotnet ef migrations has-pending-model-changes
dotnet ef migrations add <Name>
dotnet ef database update
dotnet ef database update <MigrationName>   # migrate to specific version
dotnet ef migrations script                 # generate SQL for DBA review
```

---

## Related docs

- [LEAVE_MODULE.md](./LEAVE_MODULE.md) — leave feature setup and test accounts (also requires migrations applied)
- [jasper-setup.md](./jasper-setup.md) — reporting server (separate from EF migrations)

---

*Last updated: team migration guide — avoids schema drift from partial/no-op migrations and local DB sync issues.*
