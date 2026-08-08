// 매출예측 화면 — Figma "매출예측"(node 9:747) 레이아웃(그래프 2개 나란히 + 매출 분석)에 맞춰 구성.
// AI 예측(Phase 7)·오차율 분석(Phase 12)은 아직 없어 "매출 분석"은 준비 중으로 남기되,
// 상단 그래프 2개는 실제 GET /api/sales/monthly 데이터(매출 추이 / 판매건수 추이)로 렌더링.
import { useQuery } from "@tanstack/react-query";
import { getMonthlyRevenue } from "../api/endpoints/sales";
import { RevenueBarChart } from "../components/dashboard/revenue-chart";
import { DashboardShell } from "../components/dashboard/shell";

export default function ForecastPage() {
  const { data: monthly = [] } = useQuery({
    queryKey: ["sales-monthly", 12],
    queryFn: () => getMonthlyRevenue(12),
    staleTime: 60_000,
  });

  return (
    <DashboardShell active="forecast">
      <div className="space-y-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#101828]">매출 그래프</h1>
          <p className="text-sm text-[#99a1af]">
            AI 매출 예측(Phase 7)은 준비 중입니다 — 아래는 실제 업로드된 매출 데이터입니다.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#364153]">월별 매출 추이</h2>
            <RevenueBarChart data={monthly} metric="revenue" />
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#364153]">월별 판매 건수 추이</h2>
            <RevenueBarChart
              data={monthly}
              metric="sales_count"
              emptyLabel="판매 데이터가 연결되면 표시됩니다."
            />
          </section>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#364153]">매출 분석</h2>
          <div className="rounded-xl border border-dashed border-[#d1d5dc] bg-white p-6">
            <p className="text-sm text-[#99a1af]">
              예측 대비 오차율(%)과 기온·주말·공휴일·강수 등 영향 요소 분석은 AI 서버 연동(Phase 12)
              이후 제공됩니다.
            </p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
