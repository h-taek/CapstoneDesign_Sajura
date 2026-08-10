// 매출예측 화면 — 참고 대시보드 목업(예측정확도·오차율·누적매출·전월대비 카드 +
// 이번달/지난달 매출 그래프 + 오차율분석/영향요인) 레이아웃에 맞춰 재구성.
// AI 예측(Phase 7)·오차율 분석(Phase 12)은 아직 없어 그 부분만 정직하게 "준비 중"으로
// 남기고, 나머지(이번 달 누적매출·전월 대비·일별 실제매출 그래프)는 실제 GET /api/sales/*
// 데이터로 렌더링한다.
import { useQuery } from "@tanstack/react-query";
import { Activity, DollarSign, Target, TrendingUp } from "lucide-react";
import {
  getDailyRevenueForMonth,
  getMonthlyRevenue,
  getSalesSummary,
} from "../api/endpoints/sales";
import { RevenueBarChart } from "../components/dashboard/revenue-chart";
import { DashboardShell } from "../components/dashboard/shell";

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" });

function yearMonthOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function ForecastPage() {
  const now = new Date();
  const thisMonth = yearMonthOf(now);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = yearMonthOf(lastMonthDate);

  const { data: summary } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: getSalesSummary,
    staleTime: 60_000,
  });
  const { data: monthly = [] } = useQuery({
    queryKey: ["sales-monthly", 2],
    queryFn: () => getMonthlyRevenue(2),
    staleTime: 60_000,
  });
  const { data: thisMonthDaily = [] } = useQuery({
    queryKey: ["sales-daily-by-month", thisMonth],
    queryFn: () => getDailyRevenueForMonth(thisMonth),
    staleTime: 60_000,
  });
  const { data: lastMonthDaily = [] } = useQuery({
    queryKey: ["sales-daily-by-month", lastMonth],
    queryFn: () => getDailyRevenueForMonth(lastMonth),
    staleTime: 60_000,
  });

  const prevMonthPoint = monthly.find((m) => m.year_month === lastMonth);
  const thisMonthPoint = monthly.find((m) => m.year_month === thisMonth);
  const momChangePercent =
    prevMonthPoint && prevMonthPoint.revenue > 0 && thisMonthPoint
      ? ((thisMonthPoint.revenue - prevMonthPoint.revenue) / prevMonthPoint.revenue) * 100
      : null;

  const STAT_CARDS = [
    {
      label: "예측 정확도",
      value: "준비 중",
      icon: Target,
      sub: "AI 서버 연동 후 제공",
    },
    {
      label: "평균 오차율",
      value: "준비 중",
      icon: Activity,
      sub: "AI 서버 연동 후 제공",
    },
    {
      label: "이번 달 누적매출",
      value: won.format(summary?.this_month_revenue ?? 0),
      icon: DollarSign,
      sub: `판매 ${summary?.this_month_sales_count ?? 0}건`,
    },
    {
      label: "전월 대비",
      value:
        momChangePercent === null
          ? "—"
          : `${momChangePercent >= 0 ? "+" : ""}${momChangePercent.toFixed(1)}%`,
      icon: TrendingUp,
      sub: prevMonthPoint ? `전월 ${won.format(prevMonthPoint.revenue)}` : "전월 데이터 없음",
    },
  ];

  return (
    <DashboardShell active="forecast">
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#101828]">
            매출 그래프 (예측 매출/실제 매출)
          </h1>
          <p className="text-sm text-[#99a1af]">
            AI 매출 예측(Phase 7)은 준비 중입니다 — 아래 매출 데이터는 실제 업로드된 값입니다.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="space-y-2 rounded-xl border border-[#d1d5dc] bg-white p-4"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#7a5eff]/10 text-[#7a5eff]">
                  <Icon className="size-4.5" />
                </span>
                <p className="text-xs text-[#99a1af]">{card.label}</p>
                <p className="text-lg font-semibold text-[#101828]">{card.value}</p>
                <p className="text-xs text-[#99a1af]">{card.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#364153]">이번 달 매출 그래프</h2>
            <RevenueBarChart data={thisMonthDaily} xKey="date" variant="area" />
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#364153]">지난 달 매출 그래프</h2>
            <RevenueBarChart data={lastMonthDaily} xKey="date" variant="area" />
          </section>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#364153]">오차율 분석 · 영향 요인</h2>
          <div className="rounded-xl border border-dashed border-[#d1d5dc] bg-white p-6">
            <p className="text-sm text-[#99a1af]">
              예측 대비 오차율 분석과 기온·주말·공휴일·강수 등 영향 요인 TOP 6는 AI 서버 연동(Phase
              12) 이후 실데이터로 제공됩니다.
            </p>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
