import { Routes } from '@angular/router';
import { Unauthorized } from './common/components/unauthorized/unauthorized';
import { authGuard } from './common/auth.guard';
import { WebLayout } from './shared/components/web-layout/web-layout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/main-dashboard/main-dashboard').then(
            (m) => m.MainDashboard,
          ),
      },
    ],
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/notifications/notifications').then(
        (m) => m.Notifications,
      ),
  },
  {
    path: 'change-password-internal',
    loadComponent: () =>
      import('./components/change-password-internal/change-password-internal').then(
        (m) => m.ChangePasswordInternal,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then((m) => m.Login),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./components/confirmEmail/confirmEmail').then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: 'reset-link',
    loadComponent: () =>
      import('./components/confirmEmail/confirmEmail').then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/reset-password/reset-password').then(
        (m) => m.ResetPassword,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register').then((m) => m.Register),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'clients',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/client/client').then((m) => m.Client),
      },
    ],
  },
  {
    path: 'incomes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/income/income').then((m) => m.Income),
      },
    ],
  },
  {
    path: 'supplier-payments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/supplier-payment/supplier-payment').then(
            (m) => m.SupplierPayment,
          ),
      },
    ],
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/project/project').then((m) => m.Project),
      },
    ],
  },
  {
    path: 'material-requests',
    component: WebLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/materialRequests/material-request-routing.module').then(
            (m) => m.MaterialRequestRoutingModule,
          ),
      },
    ],
  },

  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/supplier/supplier').then((m) => m.Supplier),
      },
    ],
  },
  {
    path: 'payments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/payments/payments').then((m) => m.Payments),
      },
    ],
  },
  {
    path: 'user-management',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/user-management/user-management').then(
            (m) => m.UserManagement,
          ),
      },
    ],
  },
  {
    path: 'employee',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/employee/employee').then((m) => m.Employee),
      },
    ],
  },
  {
    path: 'to-do',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/to-do/to-do').then((m) => m.ToDo),
      },
    ],
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/web-layout/web-layout').then(
        (m) => m.WebLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/tasks/tasks').then((m) => m.Tasks),
      },
    ],
  },
  {
    path: 'quotations',
    component: WebLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/quotations/quotation-routing.module').then(
            (m) => m.QuotationRoutingModule,
          ),
      },
    ],
  },

  {
    path: 'purchase-orders',
    component: WebLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/purchase-orders/purchase-order-routing.module').then(
            (m) => m.PurchaseOrderRoutingModule,
          ),
      },
    ],
  },

  {
    path: 'invoices',
    component: WebLayout,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/invoices/invoice-routing.module').then(
            (m) => m.InvoiceRoutingModule,
          ),
      },
    ],
  },

  { path: 'unauthorized', component: Unauthorized },
];
