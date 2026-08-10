// 발주추천 화면 — Figma "발주추천"(node 9:989) 셸 적용.
// AI 서버(/ai/orders/recommend)에 실제 추천 엔진이 있지만 리드타임 중 예상 소비량 계산에
// 필요한 판매 이력 연동은 후속 작업이라, 우선 재고 임계값 기반(GET /api/inventory/reorder-suggestions)
// 추천만 실데이터로 제공하고 AI 예측 발주는 정직하게 "준비 중"으로 표시.
// 점주 확정(체크박스 선택 + 수량 인라인 수정)은 POST /api/orders/confirm으로 실제 기록된다
// (쿠팡 자동 담기·실제 입고 반영은 후속 작업 — 확정 = 기록만, 재고 수량은 자동 변경되지 않음).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getReorderSuggestions } from "../api/endpoints/inventory";
import { confirmOrder, listOrders } from "../api/endpoints/orders";
import { DashboardShell } from "../components/dashboard/shell";
import { Button } from "../components/ui/button";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["reorder-suggestions"],
    queryFn: getReorderSuggestions,
  });
  const { data: pastOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelected(new Set(suggestions.map((s) => s.item_id)));
    setQuantities(
      Object.fromEntries(suggestions.map((s) => [s.item_id, String(s.suggested_order_quantity)])),
    );
  }, [suggestions]);

  const mutation = useMutation({
    mutationFn: (items: { item_id: string; quantity: number }[]) => confirmOrder(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const toggle = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleConfirm = () => {
    const items = suggestions
      .filter((s) => selected.has(s.item_id))
      .map((s) => ({ item_id: s.item_id, quantity: Number(quantities[s.item_id]) }))
      .filter((i) => Number.isFinite(i.quantity) && i.quantity > 0);
    if (items.length === 0) return;
    mutation.mutate(items);
  };

  return (
    <DashboardShell active="orders">
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#101828]">발주 추천</h1>
          <p className="text-sm text-[#99a1af]">
            재고관리에 등록한 임계값 기준 추천입니다. AI 수요예측 기반 발주 추천(리드타임 중 예상
            소비량 반영)은 준비 중입니다.
          </p>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#364153]">재주문이 필요한 재료</h2>
            {suggestions.length > 0 && (
              <Button
                onClick={handleConfirm}
                disabled={selected.size === 0 || mutation.isPending}
                className="h-10 rounded-full bg-[#7a5eff] px-5 text-sm font-semibold hover:bg-[#6a4eef]"
              >
                {mutation.isPending ? "확정 중…" : `선택 발주 확정 (${selected.size})`}
              </Button>
            )}
          </div>
          {isLoading ? (
            <p className="text-sm text-[#99a1af]">불러오는 중…</p>
          ) : suggestions.length === 0 ? (
            <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-[#d1d5dc] bg-white text-sm text-[#99a1af]">
              현재 재주문이 필요한 재료가 없습니다.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#d1d5dc] bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafafa] text-[#61646b]">
                  <tr>
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 font-medium">재료</th>
                    <th className="px-4 py-3 font-medium">현재 수량</th>
                    <th className="px-4 py-3 font-medium">임계값</th>
                    <th className="px-4 py-3 font-medium">발주 수량</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={s.item_id} className="border-t border-[#eef1f4]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(s.item_id)}
                          onChange={() => toggle(s.item_id)}
                          className="size-4 accent-[#7a5eff]"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#364153]">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-red-500" />
                          {s.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#364153]">
                        {s.current_quantity} {s.unit}
                      </td>
                      <td className="px-4 py-3 text-[#364153]">
                        {s.low_stock_threshold} {s.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={quantities[s.item_id] ?? ""}
                            onChange={(e) =>
                              setQuantities((prev) => ({ ...prev, [s.item_id]: e.target.value }))
                            }
                            disabled={!selected.has(s.item_id)}
                            className="h-9 w-24 rounded-lg border border-[#d1d5dc] px-2 text-sm disabled:bg-[#f3f4f6] disabled:text-[#99a1af]"
                          />
                          <span className="text-[#99a1af]">{s.unit}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {mutation.isSuccess && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" /> 발주가 확정되었습니다. 실제 주문·입고 처리는 직접
              진행해주세요.
            </p>
          )}
        </section>

        {pastOrders.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#364153]">발주 확정 이력</h2>
            <div className="space-y-2">
              {pastOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="rounded-xl border border-[#d1d5dc] bg-white p-4 text-sm"
                >
                  <p className="mb-1 text-xs text-[#99a1af]">
                    {new Date(order.created_at).toLocaleString("ko-KR")}
                  </p>
                  <p className="text-[#364153]">
                    {order.items.map((i) => `${i.name} ${i.quantity}${i.unit}`).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#364153]">AI 예측 발주</h2>
          <div className="rounded-xl border border-dashed border-[#d1d5dc] bg-white p-6 text-sm text-[#99a1af]">
            매출 예측(AI 서버) 기반으로 리드타임 동안 소비될 재료량을 미리 계산하는 발주 추천은 준비
            중입니다.
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
