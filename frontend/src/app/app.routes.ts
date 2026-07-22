import { Routes } from '@angular/router';
import { Unauthorized } from './common/components/unauthorized/unauthorized';
import { authGuard } from './common/auth.guard';
import { WebLayout } from './shared/components/web-layout/web-layout';
import { SplashScreen } from './components/splash-screen/splash-screen';
import { deviceRedirectGuard } from './common/device-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [deviceRedirectGuard],
    component: SplashScreen,
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
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
    canActivate: [authGuard],
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
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
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
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/expense/expense').then((m) => m.Expense),
      },
    ],
  },
  {
    path: 'supplier-payments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
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
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
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
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/settings/user-management/user-management').then(
            (m) => m.UserManagement,
          ),
      },
    ],
  },
  {
    path: 'quotations',
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
    canActivate: [authGuard],
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
    canActivate: [authGuard],
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
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/department/department').then(
            (m) => m.Department,
          ),
      },
    ],
  },
  {
    path: 'access-permission',
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/accessPermission/accessPermission').then(
            (m) => m.AccessPermission,
          ),
      },
    ],
  },
  {
    path: 'company',
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

  //Logistic
  {
    path: 'inventory',
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
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/ProductsServices/ProductsServices').then(
            (m) => m.ProductsServices,
          ),
      },
    ],
  },
  //mobile highlight
  {
    path: 'splash-screen',
    component: SplashScreen,
  },
  {
    path: 'profile-settings',
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/mobile-settings/mobile-settings').then(
            (m) => m.MobileSettings,
          ),
      },
    ],
  },
  {
    path: 'tasks',
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
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/schedule/schedule').then((m) => m.Schedule),
      },
    ],
  },

  {
    path: 'leave',
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
    path: 'claims',
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
    loadComponent: () =>
      import('./common/components/ResponsiveLayout/ResponsiveLayout').then(
        (m) => m.ResponsiveLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/personal-info/personal-info').then(
            (m) => m.PersonalInfo,
          ),
      },
    ],
  },

  { path: 'unauthorized', component: Unauthorized },
];
