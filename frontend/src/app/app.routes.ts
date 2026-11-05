import { Routes } from '@angular/router';
import { Unauthorized } from './common/components/unauthorized/unauthorized';
import { authGuard } from './common/guard/auth.guard';
import { modulePermissionGuard } from './common/permission/module-permission.guard';
import { SplashScreen } from './components/auth/splash-screen/splash-screen';
import { deviceRedirectGuard } from './common/guard/device-redirect.guard';

const protectedGuards = [authGuard, modulePermissionGuard] as const;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [deviceRedirectGuard],
    component: SplashScreen,
  },
  {
    path: 'get-started',
    loadComponent: () =>
      import('./components/get-started/get-started').then((m) => m.GetStarted),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
  },
  {
    path: 'email-link',
    loadComponent: () =>
      import('./components/auth/email-link/email-link').then(
        (m) => m.EmailLink,
      ),
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
    path: 'notice',
    data: { moduleKey: 'notice' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'notice' },
        loadComponent: () =>
          import('./components/notice/notice').then((m) => m.Notice),
      },
    ],
  },
  {
    path: 'announcements',
    data: { moduleKey: 'announcements' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'announcements' },
        loadComponent: () =>
          import('./components/announcements/announcements').then(
            (m) => m.Announcements,
          ),
      },
    ],
  },
  {
    path: 'directory',
    data: { moduleKey: 'directory' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'directory' },
        loadComponent: () => {
          const isMobile = window.innerWidth < 768;

          return isMobile
            ? import('./components/directory/directory').then(
                (m) => m.Directory,
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
    data: { moduleKey: 'notifications' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'notifications' },
        loadComponent: () =>
          import('./components/notifications/notifications').then(
            (m) => m.Notifications,
          ),
      },
    ],
  },

  {
    path: 'change-password',
    loadComponent: () =>
      import('./components/change-password-internal/change-password-internal').then(
        (m) => m.ChangePasswordInternal,
      ),
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
    // canActivate: [...protectedGuards],
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
    path: 'activity-log',
    data: { moduleKey: 'activity-log' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'activity-log' },
        loadComponent: () =>
          import('./components/activity-log/activity-log').then(
            (m) => m.ActivityLog,
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
    // canActivate: [...protectedGuards],
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
    path: 'my-tasks',
    data: { moduleKey: 'my-tasks' },
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
    path: 'office-handbook',
    data: { moduleKey: 'office-handbook' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'office-handbook' },
        loadComponent: () =>
          import('./components/OfficeHandbook/OfficeHandbook').then(
            (m) => m.OfficeHandbookComponent,
          ),
      },
    ],
  },

  {
    path: 'task-management',
    data: { moduleKey: 'task-management' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'task-management' },
        loadChildren: () =>
          import('./components/task-management/tasks-management-routing.module').then(
            (m) => m.TaskManagementRoutingModule,
          ),
      },
    ],
  },

  {
    path: 'daily-reports',
    data: { moduleKey: 'daily-reports' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'daily-reports' },
        loadComponent: () =>
          import('./components/daily-report/daily-report').then(
            (m) => m.DailyReport,
          ),
      },
    ],
  },
  {
    path: 'daily-reports/team',
    data: { moduleKey: 'daily-reports/team' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'daily-reports/team' },
        loadComponent: () =>
          import('./components/team-daily-report/team-daily-report').then(
            (m) => m.TeamDailyReport,
          ),
      },
    ],
  },

  {
    path: 'hardware-request',
    data: { moduleKey: 'hardware-request' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'hardware-request' },
        loadComponent: () =>
          import('./components/hardware-requests/hardware-request/hardware-request').then(
            (m) => m.HardwareRequest,
          ),
      },
      {
        path: 'incoming',
        data: { moduleKey: 'incoming' },
        loadComponent: () =>
          import('./components/hardware-requests/incoming-hardware-request/incoming-hardware-request').then(
            (m) => m.IncomingHardwareRequest,
          ),
      },
      // {
      //   path: ':id',
      //   data: { moduleKey: 'hardware-request' },
      //   loadComponent: () =>
      //     import('./components/hardware-requests/hardware-request-details/hardware-request-details').then(
      //       (m) => m.HardwareRequestDetails,
      //     ),
      // },
    ],
  },

  {
    path: 'task-management/form',
    loadComponent: () =>
      import('./components/task-management/task-form/task-form').then(
        (m) => m.TaskForm,
      ),
  },

  { path: 'unauthorized', component: Unauthorized },
];
