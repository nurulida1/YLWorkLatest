#!/usr/bin/env node
/**
 * Smoke-test SPA routes + key APIs for leave Staff / Manager / HR accounts.
 * Native fetch only. Always exits 0; writes smoke-routes-result.json beside this script.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:5000';
const SPA_BASE = 'http://localhost:4200';
const RESULT_PATH = join(__dirname, 'smoke-routes-result.json');

const ACCOUNTS = [
  {
    role: 'Staff',
    email: 'leave.emp1@ylwork.local',
    password: 'Staff123!',
  },
  {
    role: 'Manager',
    email: 'leave.manager1@ylwork.local',
    password: 'Manager123!',
  },
  {
    role: 'HR',
    email: 'leave.hr@ylwork.local',
    password: 'Hr123!',
  },
];

const SPA_ROUTES = [
  '/dashboard',
  '/leave',
  '/leave/apply',
  '/leave/history',
  '/leave/approvals',
  '/claims',
  '/claims/apply',
  '/claims/history',
  '/claims/approvals',
  '/meeting',
  '/my-tasks',
  '/daily-reports',
  '/daily-reports/team',
  '/hardware-request',
  '/hardware-request/incoming',
  '/projects',
  '/quotations',
  '/products-services',
  '/sales-order',
  '/delivery-orders',
  '/purchase-orders',
  '/goods-receiving',
  '/do-rma',
  '/inventory/listing',
  '/inventory/category',
  '/inventory/location',
  '/inventory/section',
  '/invoices/sales',
  '/invoices/purchase',
  '/expenses',
  '/incomes',
  '/payments',
  '/company',
  '/department',
  '/supplier',
  '/clients',
  '/user-management',
  '/profile-settings',
  '/settings/system-module',
  '/settings/role-permission',
  '/settings/leave-types',
  '/settings/leave-policy',
  '/settings/leave-holidays',
  '/settings/leave-calendar-sync',
  '/settings/claim-settings',
  '/activity-log',
  '/announcements',
  '/office-handbook',
  '/notifications',
];

const COMMON_APIS = [
  '/api/App/GetStaffDashboard',
  '/api/LeaveRequests',
  '/api/LeaveTypes',
  '/api/ClaimRequests',
  '/api/ClaimRequests/dashboard',
  '/api/Users/Profile',
  '/api/Notification/UnreadCount',
];

const HR_APIS = [
  '/api/LeavePolicy',
  '/api/LeaveTypes',
  '/api/App/GetHrDashboard',
  '/api/SystemModule/GetMany?page=1&pageSize=5',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function noteFromStatus(status, kind) {
  if (status === null || status === undefined) return 'network error';
  if (status >= 200 && status < 300) return kind === 'spa' ? 'SPA HTML OK' : 'OK';
  if (status === 401 || status === 403) return 'auth denied';
  if (status === 404) return 'not found';
  if (status >= 500) return 'server error';
  return `HTTP ${status}`;
}

async function fetchStatus(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    return { status: res.status, ok: res.ok, error: null };
  } catch (err) {
    return { status: null, ok: false, error: err?.message || String(err) };
  }
}

async function loginOnce(email, password) {
  const url = `${API_BASE}/api/Auth/authenticate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(20000),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data?.success || !data?.accessToken) {
      return {
        success: false,
        status: res.status,
        message: data?.message || `login HTTP ${res.status}`,
        accessToken: null,
        userId: null,
        systemRole: null,
      };
    }
    return {
      success: true,
      status: res.status,
      message: data.message || 'Login successful',
      accessToken: data.accessToken,
      userId: data.userId,
      systemRole: data.systemRole,
    };
  } catch (err) {
    return {
      success: false,
      status: null,
      message: err?.message || String(err),
      accessToken: null,
      userId: null,
      systemRole: null,
    };
  }
}

async function login(email, password) {
  let result = await loginOnce(email, password);
  if (!result.success) {
    await sleep(1500);
    result = await loginOnce(email, password);
  }
  return result;
}

async function smokeApis(role, token, paths) {
  const rows = [];
  for (const path of paths) {
    const { status, error } = await fetchStatus(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    rows.push({
      role,
      path,
      status: status ?? 'ERR',
      note: error ? `API: ${error}` : `API: ${noteFromStatus(status, 'api')}`,
      kind: 'api',
    });
  }
  return rows;
}

async function smokeSpa(role) {
  const rows = [];
  for (const route of SPA_ROUTES) {
    const { status, error } = await fetchStatus(`${SPA_BASE}${route}`, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });
    rows.push({
      role,
      path: route,
      status: status ?? 'ERR',
      note: error ? `SPA: ${error}` : `SPA: ${noteFromStatus(status, 'spa')}`,
      kind: 'spa',
    });
  }
  return rows;
}

function printTable(rows) {
  const roleW = Math.max(4, ...rows.map((r) => String(r.role).length));
  const pathW = Math.max(4, ...rows.map((r) => String(r.path).length));
  const statusW = Math.max(6, ...rows.map((r) => String(r.status).length));
  const noteW = Math.max(4, ...rows.map((r) => String(r.note).length));

  const header = `| ${'role'.padEnd(roleW)} | ${'path'.padEnd(pathW)} | ${'status'.padEnd(statusW)} | ${'note'.padEnd(noteW)} |`;
  const sep = `| ${'-'.repeat(roleW)} | ${'-'.repeat(pathW)} | ${'-'.repeat(statusW)} | ${'-'.repeat(noteW)} |`;
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    console.log(
      `| ${String(r.role).padEnd(roleW)} | ${String(r.path).padEnd(pathW)} | ${String(r.status).padEnd(statusW)} | ${String(r.note).padEnd(noteW)} |`,
    );
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const rows = [];
  const logins = [];

  for (const account of ACCOUNTS) {
    const loginResult = await login(account.email, account.password);
    logins.push({
      role: account.role,
      email: account.email,
      ...loginResult,
      accessToken: loginResult.accessToken ? '[redacted]' : null,
    });

    rows.push({
      role: account.role,
      path: 'POST /api/Auth/authenticate',
      status: loginResult.status ?? 'ERR',
      note: loginResult.success
        ? `login OK (${loginResult.systemRole || account.role}, userId=${loginResult.userId})`
        : `login failed: ${loginResult.message}`,
      kind: 'auth',
    });

    if (!loginResult.success) {
      continue;
    }

    // SPA routes (same for each role — verifies Angular serves HTML)
    rows.push(...(await smokeSpa(account.role)));

    // Common APIs
    rows.push(...(await smokeApis(account.role, loginResult.accessToken, COMMON_APIS)));

    // Role-specific APIs
    if (account.role === 'HR') {
      rows.push(...(await smokeApis(account.role, loginResult.accessToken, HR_APIS)));
    }

    if (account.role === 'Manager' || account.role === 'HR') {
      const pendingPath = `/api/LeaveRequests/pending/hod/${loginResult.userId}`;
      rows.push(
        ...(await smokeApis(account.role, loginResult.accessToken, [pendingPath])),
      );
    }
  }

  printTable(rows);

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    apiBase: API_BASE,
    spaBase: SPA_BASE,
    logins,
    results: rows,
    counts: {
      total: rows.length,
      ok2xx: rows.filter((r) => typeof r.status === 'number' && r.status >= 200 && r.status < 300).length,
      authDenied: rows.filter((r) => r.status === 401 || r.status === 403).length,
      errors: rows.filter((r) => r.status === null || r.status === 'ERR' || (typeof r.status === 'number' && r.status >= 500)).length,
    },
  };

  writeFileSync(RESULT_PATH, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`\nWrote ${RESULT_PATH}`);
  console.log(
    `Summary: total=${summary.counts.total} 2xx=${summary.counts.ok2xx} auth=${summary.counts.authDenied} errors=${summary.counts.errors}`,
  );
}

main()
  .catch((err) => {
    console.error('Smoke script crashed:', err);
    try {
      writeFileSync(
        RESULT_PATH,
        JSON.stringify(
          {
            startedAt: new Date().toISOString(),
            error: err?.message || String(err),
            results: [],
          },
          null,
          2,
        ),
        'utf8',
      );
    } catch {
      /* ignore */
    }
  })
  .finally(() => {
    process.exit(0);
  });
