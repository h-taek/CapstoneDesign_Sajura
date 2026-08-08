// 식자재 가격 API — 홈 화면 "실시간 최저가 추천" (KAMIS 연동).
import { api } from "../../lib/api";

export interface IngredientPrice {
  item_name: string;
  price: number;
  unit: string;
  direction: "UP" | "DOWN" | "SAME";
  change_percent: number;
  source: string;
}

export async function getIngredientPrices(): Promise<IngredientPrice[]> {
  return api.get("prices/ingredients").json<IngredientPrice[]>();
}
