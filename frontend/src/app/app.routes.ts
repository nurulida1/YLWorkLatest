import { Routes } from '@angular/router';

import { Unauthorized } from './common/components/unauthorized/unauthorized';
import { authGuard } from './common/guard/auth.guard';
import { modulePermissionGuard } from './common/permission/module-permission.guard';
import { SplashScreen } from './components/auth/splash-screen/splash-screen';
import { deviceRedirectGuard } from './common/guard/device-redirect.guard';
import { TermsPrivacy } from './components/settings/terms-privacy/terms-privacy';

const protectedGuards = [authGuard, modulePermissionGuard] as const;

export const routes: Routes = [
  // =========================================================
  // 01. AUTHENTICATION
  // =========================================================

  {
    path: '',
    pathMatch: 'full',
    canMatch: [deviceRedirectGuard],
    component: SplashScreen,
  },
  {
    path: 'get-started',
    loadComponent: () =>
      import('./components/auth/get-started/get-started').then(
        (m) => m.GetStarted,
      ),
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
    path: 'change-password',
    data: { moduleKey: 'change-password' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'change-password' },
        loadComponent: () =>
          import('./components/settings/change-password/change-password').then(
            (m) => m.ChangePassword,
          ),
      },
    ],
  },

  {
    path: 'email-link',
    loadComponent: () =>
      import('./components/auth/email-link/email-link').then(
        (m) => m.EmailLink,
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./components/auth/confirmEmail/confirmEmail').then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: 'reset-link',
    loadComponent: () =>
      import('./components/auth/confirmEmail/confirmEmail').then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/auth/reset-password/reset-password').then(
        (m) => m.ResetPassword,
      ),
  },
  {
    path: 'splash-screen',
    component: SplashScreen,
  },

  // =========================================================
  // 02. DASHBOARD
  // =========================================================

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

  // =========================================================
  // 03. ACTIVITY & COMMUNICATION
  // =========================================================

  // Activity Log
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

  // Announcements
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
        loadChildren: () =>
          import('./components/announcement/announcement-routing.module').then(
            (m) => m.AnnouncementRoutingModule,
          ),
      },
    ],
  },

  // Notifications
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

  // =========================================================
  // 04. LEAVE MANAGEMENT
  // =========================================================

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

  // =========================================================
  // 05. CLAIMS MANAGEMENT
  // =========================================================

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

  // =========================================================
  // 06. MY WORK
  // =========================================================

  // Meetings
  {
    path: 'meeting',
    // canActivate: [...protectedGuards],
    data: { moduleKey: 'meeting' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./components/my-work/meeting/meeting-routing.module').then(
            (m) => m.MeetingRoutingModule,
          ),
      },
    ],
  },

  // My Daily Reports
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
          import('./components/my-work/daily-report/daily-report').then(
            (m) => m.DailyReport,
          ),
      },
    ],
  },

  // Team Daily Reports
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
          import('./components/my-work/team-daily-report/team-daily-report').then(
            (m) => m.TeamDailyReport,
          ),
      },
    ],
  },

  // My Tasks
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
        data: { moduleKey: 'my-tasks' },
        loadComponent: () =>
          import('./components/my-work/staffTasks/staffTasks').then(
            (m) => m.StaffTasks,
          ),
      },
    ],
  },

  // =========================================================
  // 07. SUPPORT & REQUESTS
  // =========================================================

  // Hardware Requests
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
          import('./components/support-requests/hardware-request/hardware-request/hardware-request').then(
            (m) => m.HardwareRequest,
          ),
      },
      {
        path: 'incoming',
        data: { moduleKey: 'incoming' },
        loadComponent: () =>
          import('./components/support-requests/hardware-request/incoming-hardware-request/incoming-hardware-request').then(
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

  // =========================================================
  // 08. PROJECT MANAGEMENT
  // =========================================================

  // Projects
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
          import('./components/project-management/project/project-routing.module').then(
            (m) => m.ProjectRoutingModule,
          ),
      },
    ],
  },

  // Quotations
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
          import('./components/project-management/quotation/quotation-routing.module').then(
            (m) => m.QuotationRoutingModule,
          ),
      },
    ],
  },

  // =========================================================
  // 09. SALES & PURCHASING
  // =========================================================

  // Products & Services
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
          import('./components/sales-purchasing/ProductsServices/ProductsServices').then(
            (m) => m.ProductsServices,
          ),
      },
    ],
  },

  // Sales Orders
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
          import('./components/sales-purchasing/sales-order/sales-order-routing.module').then(
            (m) => m.SalesOrderRoutingModule,
          ),
      },
    ],
  },

  // Purchase Orders
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
          import('./components/sales-purchasing/purchase-orders/purchase-order-routing.module').then(
            (m) => m.PurchaseOrderRoutingModule,
          ),
      },
    ],
  },

  // Goods Receiving
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
          import('./components/sales-purchasing/good-receiving/goods-receiving-routing.module').then(
            (m) => m.GoodsReceivingRoutingModule,
          ),
      },
    ],
  },

  // Delivery Orders
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
          import('./components/sales-purchasing/delivery-order/delivery-order-routing.module').then(
            (m) => m.DeliveryOrderRoutingModule,
          ),
      },
    ],
  },

  // DO RMA
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
          import('./components/sales-purchasing/do-rma/do-rma-routing.module').then(
            (m) => m.DORMARoutingModule,
          ),
      },
    ],
  },

  // =========================================================
  // 10. INVENTORY MANAGEMENT
  // =========================================================

  {
    path: 'inventory',
    // auth only here — modulePermissionGuard needs child moduleKey (listing/item/etc).
    canActivate: [authGuard],
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

  // =========================================================
  // 11. FINANCE
  // =========================================================

  // Invoices
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
          import('./components/finances/invoice/invoice-routing.module').then(
            (m) => m.InvoiceRoutingModule,
          ),
      },
    ],
  },

  // Expenses
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
          import('./components/finances/expense/expense').then(
            (m) => m.Expense,
          ),
      },
    ],
  },

  // Incomes
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
          import('./components/finances/income/income').then((m) => m.Income),
      },
    ],
  },

  // Payments
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
          import('./components/finances/payments/payments').then(
            (m) => m.Payments,
          ),
      },
    ],
  },

  // Supplier Payments
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
          import('./components/finances/supplier-payment/supplier-payment').then(
            (m) => m.SupplierPayment,
          ),
      },
    ],
  },

  // =========================================================
  // 12. COMPANY MANAGEMENT
  // =========================================================

  // Company
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
          import('./components/company-management/companies/company-routing.module').then(
            (m) => m.CompanyRoutingModule,
          ),
      },
    ],
  },

  // Directory
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
            ? import('./components/company-management/directory/directory').then(
                (m) => m.Directory,
              )
            : import('./components/main-dashboard/dashboard/dashboard').then(
                (m) => m.Dashboard,
              );
        },
      },
    ],
  },

  // Clients
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
          import('./components/company-management/clients/client-routing.module').then(
            (m) => m.ClientRoutingModule,
          ),
      },
    ],
  },

  // Suppliers
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
          import('./components/company-management/suppliers/supplier-routing.module').then(
            (m) => m.SupplierRoutingModule,
          ),
      },
    ],
  },

  // Departments
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
          import('./components/company-management/department/department').then(
            (m) => m.Department,
          ),
      },
    ],
  },

  // =========================================================
  // 13. ADMINISTRATION & SETTINGS
  // =========================================================

  // Settings Module
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

  // Mobile Settings
  {
    path: 'mobile-settings',
    data: { moduleKey: 'mobile-settings' },
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        data: { moduleKey: 'mobile-settings' },
        loadComponent: () =>
          import('./components/settings/mobile-settings/mobile-settings').then(
            (m) => m.MobileSettings,
          ),
      },
    ],
  },

  // User Management
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

  // Profile Settings
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
          import('./components/settings/personal-info/personal-info').then(
            (m) => m.PersonalInfo,
          ),
      },
    ],
  },

  // Personal Information
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
          import('./components/settings/personal-info/personal-info').then(
            (m) => m.PersonalInfo,
          ),
      },
    ],
  },

  // =========================================================
  // 14. OFFICE HANDBOOK
  // =========================================================

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
    path: 'terms-privacy',
    component: TermsPrivacy,
  },

  // =========================================================
  // 15. ERROR PAGES
  // =========================================================

  {
    path: 'unauthorized',
    component: Unauthorized,
  },
];
