// 메뉴 API — api_spec.md §4.
import { api } from "../../lib/api";

export interface MenuInput {
  name: string;
  category: string;
  price: number;
  is_active: boolean;
  use_inventory_deduction: boolean;
}

export interface BulkMenusResponse {
  created: number;
  skipped: number;
  skipped_names: string[];
}

export async function createMenusBulk(
  menus: MenuInput[],
): Promise<BulkMenusResponse> {
  return api.post("menus/bulk", { json: { menus } }).json<BulkMenusResponse>();
}
