export type PermissionAction =
  | 'canRead'
  | 'canCreate'
  | 'canUpdate'
  | 'canDelete'
  | 'canUpdateStatus';

export const EMPTY_MODULE_RIGHTS = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canUpdateStatus: false,
} as const;
