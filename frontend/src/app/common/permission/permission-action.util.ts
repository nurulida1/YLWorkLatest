import { PermissionAction } from './permission.types';

/** Path ends with or contains `form` → create/update; otherwise view (read). */
export function inferPermissionActions(url: string): PermissionAction[] {
  const path = url.split('?')[0].toLowerCase();
  const segments = path.split('/').filter(Boolean);

  if (segments.some((s) => s === 'form')) {
    return ['canCreate', 'canUpdate'];
  }

  return ['canRead'];
}

export function firstUrlSegment(url: string): string | null {
  const segments = url.split('?')[0].split('/').filter(Boolean);
  return segments[0]?.toLowerCase() ?? null;
}

export function hasAnyAction(
  rights: Record<PermissionAction, boolean>,
  actions: PermissionAction[],
): boolean {
  return actions.some((action) => rights[action] === true);
}
