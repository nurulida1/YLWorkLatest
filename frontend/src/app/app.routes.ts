import { Routes } from '@angular/router';
import { Unauthorized } from './common/components/unauthorized/unauthorized';
import { authGuard } from './common/auth.guard';
import { modulePermissionGuard } from './common/permission/module-permission.guard';
import { SplashScreen } from './components/splash-screen/splash-screen';
import { deviceRedirectGuard } from './common/device-redirect.guard';

const protectedGuards = [authGuard, modulePermissionGuard] as const;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [deviceRedirectGuard],
    component: SplashScreen,
  },
  {
    path: 'dashboard',
    // canActivate: [...protectedGuards],
    data: { moduleKey: 'dashboard' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'dashboard' },
        loadComponent: () => {
          const isMobile = window.innerWidth < 768;

          return isMobile
            ? import('./components/main-dashboard/mobile-dashboard/mobile-dashboard').then(
                (m) => m.MobileDashboard,
              )
            : import('./components/main-dashboard/dashboard/dashboard').then(
                (m) => m.Dashboard,
              );
        },
      },
    ],
  },
  {
    path: 'notifications',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'notifications' },
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
    canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/settings/settings-routing.module').then(
            (m) => m.SettingsRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'clients',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'clients' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/clients/client-routing.module').then(
            (m) => m.ClientRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'incomes',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'incomes' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'incomes' },
        loadComponent: () =>
          import('./components/income/income').then((m) => m.Income),
      },
    ],
  },
  {
    path: 'expenses',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'expenses' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'expenses' },
        loadComponent: () =>
          import('./components/expense/expense').then((m) => m.Expense),
      },
    ],
  },
  {
    path: 'supplier-payments',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'supplier-payments' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'supplier-payments' },
        loadComponent: () =>
          import('./components/supplier-payment/supplier-payment').then(
            (m) => m.SupplierPayment,
          ),
      },
    ],
  },
  {
    path: 'projects',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'projects' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/projects/project-routing.module').then(
            (m) => m.ProjectRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'material-requests',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'material-requests' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
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
    path: 'supplier',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'supplier' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/suppliers/supplier-routing.module').then(
            (m) => m.SupplierRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'payments',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'payments' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'payments' },
        loadComponent: () =>
          import('./components/payments/payments').then((m) => m.Payments),
      },
    ],
  },
  {
    path: 'user-management',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'user-management' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'user-management' },
        loadComponent: () =>
          import('./components/settings/user-management/user-management').then(
            (m) => m.UserManagement,
          ),
      },
    ],
  },
  {
    path: 'quotations',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'quotations' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
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
    path: 'goods-receiving',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'goods-receiving' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/goods-receiving/goods-receiving-routing.module').then(
            (m) => m.GoodsReceivingRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'purchase-orders',
    canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
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
    path: 'sales-order',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'sales-order' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/sales-orders/sales-order-routing.module').then(
            (m) => m.SalesOrderRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'delivery-orders',
    canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/delivery-order/delivery-order-routing.module').then(
            (m) => m.DeliveryOrderRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'do-rma',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'do-rma' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/do-rma/do-rma-routing.module').then(
            (m) => m.DORMARoutingModule,
          ),
      },
    ],
  },
  {
    path: 'invoices',
    canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
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
  {
    path: 'department',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'department' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'department' },
        loadComponent: () =>
          import('./components/department/department').then(
            (m) => m.Department,
          ),
      },
    ],
  },
  {
    path: 'access-permission',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'access-permission' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'access-permission' },
        loadComponent: () =>
          import('./components/accessPermission/accessPermission').then(
            (m) => m.AccessPermission,
          ),
      },
    ],
  },
  {
    path: 'company',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'company' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/companies/company-routing.module').then(
            (m) => m.CompanyRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'inventory',
    canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/inventories/inventory-routing.module').then(
            (m) => m.InventoryRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'products-services',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'products-services' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'products-services' },
        loadComponent: () =>
          import('./components/ProductsServices/ProductsServices').then(
            (m) => m.ProductsServices,
          ),
      },
    ],
  },
  {
    path: 'splash-screen',
    component: SplashScreen,
  },
  {
    path: 'profile-settings',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'profile-settings' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'profile-settings' },
        loadComponent: () =>
          import('./components/mobile-settings/mobile-settings').then(
            (m) => m.MobileSettings,
          ),
      },
    ],
  },
  {
    path: 'tasks',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'tasks' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/tasks/tasks-routing.module').then(
            (m) => m.TasksRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'schedule',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'schedule' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'schedule' },
        loadComponent: () =>
          import('./components/schedule/schedule').then((m) => m.Schedule),
      },
    ],
  },
  {
    path: 'leave',
    // canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/leave/leave-routing.module').then(
            (m) => m.LeaveRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'meeting',
    // canActivate: [...protectedGuards],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/meeting/meeting-routing.module').then(
            (m) => m.MeetingRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'claims',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'claims' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/claims/claims-routing.module').then(
            (m) => m.ClaimsRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'meeting-room',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'meeting-room' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/meeting-room/meeting-room-routing.module').then(
            (m) => m.MeetingRoomRoutingModule,
          ),
      },
    ],
  },
  {
    path: 'profile-settings/personal-info',
    canActivate: [...protectedGuards],
    data: { moduleKey: 'profile-settings' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'profile-settings' },
        loadComponent: () =>
          import('./components/personal-info/personal-info').then(
            (m) => m.PersonalInfo,
          ),
      },
    ],
  },

  {
    path: 'staff-tasks',
    data: { moduleKey: 'staff-tasks' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'staff-tasks' },
        loadComponent: () =>
          import('./components/staffTasks/staffTasks').then(
            (m) => m.StaffTasks,
          ),
      },
    ],
  },

  { path: 'unauthorized', component: Unauthorized },
];
