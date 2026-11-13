/**
 * Shared desktop/mobile navigation.
 * Leaf items use `moduleKey` matching System Module Code / route data.moduleKey.
 * Parent groups have no moduleKey; they show only if any child is visible.
 */
export interface AppNavItem {
  label: string;
  route?: string;
  icon?: string;
  /** System Module Code — required for permission-gated leaf items. */
  moduleKey?: string;
  /** Show only in mobile layouts when true. */
  mobileOnly?: boolean;
  public?: boolean;

  items?: AppNavItem[];
}

export interface MobileQuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  moduleKey: string;
  color: string;
  background: string;
  public?: boolean;
}

export interface MobileWorkMenuItem {
  label: string;
  description: string;
  icon: string;
  route: string;
  moduleKey: string;
  public?: boolean;
}

/** Top-level items shown above grouped management menus (desktop sidemenu). */
export const APP_MAIN_MENU: AppNavItem[] = [
  {
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'pi-home',
    moduleKey: 'dashboard',
    public: true,
  },
  {
    label: 'Office Handbook',
    route: '/office-handbook',
    icon: 'pi-book',
    moduleKey: 'office-handbook',
    public: true,
  },
];

/** Grouped management menus for desktop sidemenu. */
export const APP_MANAGEMENT_MENU: AppNavItem[] = [
  {
    label: 'My Work',
    icon: 'pi-briefcase',
    items: [
      {
        label: 'Upcoming Meetings',
        route: '/meeting',
        icon: 'pi-calendar-clock',
        moduleKey: 'meeting',
        public: true,
      },
      {
        label: 'My Tasks',
        route: '/my-tasks',
        icon: 'pi-list-check',
        moduleKey: 'my-tasks',
        public: true,
      },
      {
        label: 'My Daily Reports',
        route: '/daily-reports',
        icon: 'pi-file-edit',
        moduleKey: 'daily-reports',
        public: true,
      },
      {
        label: 'Team Daily Reports',
        route: '/daily-reports/team',
        icon: 'pi-users',
        moduleKey: 'daily-reports/team',
      },
    ],
  },
  {
    label: 'Leave & Claims',
    icon: 'pi-calendar',
    items: [
      {
        label: 'Leave Application',
        route: '/leave',
        moduleKey: 'leave',
        public: true,
      },
      {
        label: 'Apply Leave',
        route: '/leave/apply',
        moduleKey: 'leave/apply',
        public: true,
      },
      {
        label: 'Leave Approvals',
        route: '/leave/approvals',
        moduleKey: 'leave-approvals',
      },
      {
        label: 'Claims',
        route: '/claims',
        moduleKey: 'claims',
      },
      {
        label: 'Apply Claim',
        route: '/claims/apply',
        moduleKey: 'apply',
        public: true,
      },
      {
        label: 'Claim Approvals',
        route: '/claims/approvals',
        moduleKey: 'approvals',
      },
    ],
  },
  {
    label: 'Support & Requests',
    icon: 'pi-desktop',
    items: [
      {
        label: 'Hardware / IT Support',
        route: '/hardware-request',
        icon: 'pi-wrench',
        moduleKey: 'hardware-request',
        public: true,
      },
      {
        label: 'Incoming Requests',
        route: '/hardware-request/incoming',
        icon: 'pi-inbox',
        moduleKey: 'incoming',
      },
    ],
  },
  {
    label: 'Project Management',
    icon: 'pi-folder',
    items: [
      {
        label: 'Projects',
        route: '/projects',
        moduleKey: 'projects',
      },
      {
        label: 'Work Order',
        route: '/work-order',
        moduleKey: 'work-order',
      },
      {
        label: 'Job Sheet',
        route: '/job-sheet',
        moduleKey: 'job-sheet',
      },
      {
        label: 'Quotations',
        route: '/quotations',
        moduleKey: 'quotations',
      },
      {
        label: 'Quotation Templates',
        route: '/quotation-template',
        moduleKey: 'quotation-template',
      },
    ],
  },
  {
    label: 'Sales & Purchasing',
    icon: 'pi-shopping-cart',
    items: [
      {
        label: 'Products Services',
        route: '/products-services',
        moduleKey: 'products-services',
      },
      {
        label: 'Sales Order',
        route: '/sales-order',
        moduleKey: 'sales-order',
      },
      {
        label: 'Delivery Orders',
        route: '/delivery-orders',
        moduleKey: 'delivery-orders',
      },
      {
        label: 'Purchase Orders',
        route: '/purchase-orders',
        moduleKey: 'purchase-orders',
      },
      {
        label: 'Goods Receiving',
        route: '/goods-receiving',
        moduleKey: 'goods-receiving',
      },
      {
        label: 'DO RMA',
        route: '/do-rma',
        moduleKey: 'do-rma',
      },
    ],
  },
  {
    label: 'Inventory',
    icon: 'pi-box',
    items: [
      {
        label: 'Inventory Record',
        route: '/inventory/listing',
        moduleKey: 'inventory-listing',
      },
      {
        label: 'Category',
        route: '/inventory/category',
        moduleKey: 'inventory-category',
      },
      {
        label: 'Location',
        route: '/inventory/location',
        moduleKey: 'inventory-location',
      },
      {
        label: 'Section',
        route: '/inventory/section',
        moduleKey: 'inventory-section',
      },
    ],
  },
  {
    label: 'Finance',
    icon: 'pi-wallet',
    items: [
      {
        label: 'Sales Invoice',
        route: '/invoices/sales',
        moduleKey: 'invoice-sales',
      },
      {
        label: 'Purchase Invoice',
        route: '/invoices/purchase',
        moduleKey: 'invoice-purchase',
      },
      {
        label: 'Expenses',
        route: '/expenses',
        moduleKey: 'expenses',
      },
      {
        label: 'Incomes',
        route: '/incomes',
        moduleKey: 'incomes',
      },
      {
        label: 'Payments',
        route: '/payments',
        moduleKey: 'payments',
      },
    ],
  },
  {
    label: 'Company Management',
    icon: 'pi-building',
    items: [
      {
        label: 'My Company',
        route: '/company',
        moduleKey: 'company',
      },
      {
        label: 'Department',
        route: '/department',
        moduleKey: 'department',
        public: true,
      },
      {
        label: 'Suppliers',
        route: '/supplier',
        moduleKey: 'supplier',
      },
      {
        label: 'Clients',
        route: '/clients',
        moduleKey: 'clients',
      },
      {
        label: 'Directory',
        route: '/directory',
        moduleKey: 'directory',
        public: true,
      },
    ],
  },
  {
    label: 'Profile Settings',
    route: '/profile-settings',
    icon: 'pi-user',
    moduleKey: 'profile-settings',
    public: true,
  },
  {
    label: 'Administration Settings',
    icon: 'pi-cog',
    items: [
      {
        label: 'User Management',
        route: '/user-management',
        moduleKey: 'user-management',
      },

      {
        label: 'System Module',
        route: '/settings/system-module',
        moduleKey: 'settings-system-module',
      },
      {
        label: 'Role Permissions',
        route: '/settings/role-permission',
        moduleKey: 'settings-role-permission',
      },
      {
        label: 'Leave Types',
        route: '/settings/leave-types',
        moduleKey: 'settings-leave-types',
      },
      {
        label: 'Leave Policy',
        route: '/settings/leave-policy',
        moduleKey: 'settings-leave-policy',
      },
      {
        label: 'Public Holidays',
        route: '/settings/leave-holidays',
        moduleKey: 'settings-leave-holidays',
      },
      {
        label: 'Leave Calendar Sync',
        route: '/settings/leave-calendar-sync',
        moduleKey: 'settings-leave-calendar-sync',
      },
      {
        label: 'Claim Settings',
        route: '/settings/claim-settings',
        moduleKey: 'settings-claim-settings',
      },
    ],
  },
  {
    label: 'Activity Log',
    route: '/activity-log',
    icon: 'pi-history',
    moduleKey: 'activity-log',
  },
  {
    label: 'Announcements',
    route: '/announcements',
    icon: 'pi-bell',
    moduleKey: 'announcement',
    public: true,
  },
];

export const MOBILE_WORK_MENU: MobileWorkMenuItem[] = [
  {
    label: 'Upcoming Meetings',
    description: 'View your upcoming meetings',
    icon: 'pi pi-calendar-clock',
    route: '/meeting',
    moduleKey: 'meeting',
    public: true,
  },
  {
    label: 'My Tasks',
    description: 'View and manage your assigned tasks',
    icon: 'pi pi-list-check',
    route: '/my-tasks',
    moduleKey: 'my-tasks',
    public: true,
  },
  {
    label: 'My Daily Reports',
    description: 'View your submitted daily reports',
    icon: 'pi pi-file-edit',
    route: '/daily-reports',
    moduleKey: 'daily-reports',
    public: true,
  },
  {
    label: 'Team Daily Reports',
    description: 'View daily reports submitted by your team',
    icon: 'pi pi-users',
    route: '/daily-reports/team',
    moduleKey: 'daily-reports/team',
  },
];

export const MOBILE_QUICK_ACTIONS: MobileQuickAction[] = [
  {
    label: 'Apply Leave',
    description: 'Submit a leave application',
    icon: 'pi pi-calendar-plus',
    route: '/leave/apply',
    moduleKey: 'leave-apply',
    color: '#2563eb',
    background: '#eff6ff',
    public: true,
  },
  {
    label: 'Apply Claim',
    description: 'Submit an expense claim',
    icon: 'pi pi-wallet',
    route: '/claims/apply',
    moduleKey: 'apply',
    color: '#059669',
    background: '#ecfdf5',
    public: true,
  },
  {
    label: 'Daily Report',
    description: 'Submit your daily report',
    icon: 'pi pi-file-edit',
    route: '/daily-reports',
    moduleKey: 'daily-reports',
    color: '#7c3aed',
    background: '#f5f3ff',
    public: true,
  },
  {
    label: 'Hardware Request',
    description: 'Request equipment or IT support',
    icon: 'pi pi-desktop',
    route: '/hardware-request',
    moduleKey: 'hardware-request',
    color: '#ea580c',
    background: '#fff7ed',
    public: true,
  },
  {
    label: 'Create Meeting',
    description: 'Schedule a new meeting',
    icon: 'pi pi-calendar',
    route: '/meeting/form',
    moduleKey: 'meeting',
    color: '#0891b2',
    background: '#ecfeff',
    public: true,
  },
];
