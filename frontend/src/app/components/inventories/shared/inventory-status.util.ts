export const INVENTORY_AUTO_STATUSES = [
  'In Stock',
  'Low Stock',
  'Out of Stock',
  'Restock',
  'Restock (Low Stock)',
] as const;

export type InventoryAutoStatus = (typeof INVENTORY_AUTO_STATUSES)[number];

export const INVENTORY_CREATE_STATUS_OPTIONS = [
  { label: 'In Stock', value: 'In Stock' },
  { label: 'FOC', value: 'FOC' },
  { label: 'Faulty', value: 'Faulty' },
  { label: 'Under Repair', value: 'Under Repair' },
];

export const INVENTORY_EDIT_STATUS_OPTIONS = [
  { label: 'In Stock', value: 'In Stock' },
  { label: 'Low Stock', value: 'Low Stock' },
  { label: 'Out of Stock', value: 'Out of Stock' },
  { label: 'Restock', value: 'Restock' },
  { label: 'Restock (Low Stock)', value: 'Restock (Low Stock)' },
  { label: 'FOC', value: 'FOC' },
  { label: 'Faulty', value: 'Faulty' },
  { label: 'Under Repair', value: 'Under Repair' },
];

export const INVENTORY_FILTER_STATUS_OPTIONS = [
  { label: 'All Status', value: 'All' },
  ...INVENTORY_EDIT_STATUS_OPTIONS,
];

export function isInventoryAutoStatus(
  status: string | null | undefined,
): boolean {
  return INVENTORY_AUTO_STATUSES.includes(status as InventoryAutoStatus);
}

/**
 * Edit-time status rules (quantity vs original qty + par).
 * Manual statuses (FOC / Faulty / Under Repair) are left unchanged.
 *
 * Priority:
 * 1. qty = 0 → Out of Stock
 * 2. qty increased and still < par → Restock (Low Stock)
 * 3. qty increased → Restock
 * 4. qty < par → Low Stock
 * 5. otherwise keep current
 */
export function resolveInventoryEditStatus(input: {
  oldQuantity: number | null | undefined;
  newQuantity: number | null | undefined;
  parLevel: number | null | undefined;
  currentStatus: string | null | undefined;
}): string {
  const current = input.currentStatus?.trim() || 'In Stock';

  if (!isInventoryAutoStatus(current)) {
    return current;
  }

  // InputNumber can emit null while the user is typing — do not treat that as 0.
  if (input.newQuantity == null || input.newQuantity === ('' as never)) {
    return current;
  }

  const newQty = Number(input.newQuantity);
  if (Number.isNaN(newQty)) {
    return current;
  }

  const oldQty = Number(input.oldQuantity ?? 0);
  const par = Number(input.parLevel ?? 0);

  if (newQty === 0) {
    return 'Out of Stock';
  }

  const increased = newQty > oldQty;
  const belowPar = par > 0 && newQty < par;

  if (increased && belowPar) {
    return 'Restock (Low Stock)';
  }

  if (increased) {
    return 'Restock';
  }

  if (belowPar) {
    return 'Low Stock';
  }

  // Qty is above/equal par and not increased — clear a stale Out of Stock
  // left over from a null intermediate while typing.
  if (current === 'Out of Stock') {
    return 'Restock';
  }

  return current;
}
