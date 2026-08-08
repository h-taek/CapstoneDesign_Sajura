// 홈 화면 — Figma "홈 화면"(node 7:337) 레이아웃(순서: 최저가 추천 → 매출 그래프+매출분석 → 재고 현황)에
// 맞춰 재구성. 매출 그래프·매출분석(인기 메뉴)은 실제 GET /api/sales/* 데이터로 렌더링하고,
// 데이터 소스가 없는 최저가 추천·재고 현황은 Figma의 Table 컴포넌트 모양 그대로 "준비 중" 스켈레톤으로 표시.
import { useQuery } from "@tanstack/react-query";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import { getIngredientPrices } from "../api/endpoints/prices";
import { getMonthlyRevenue, getSalesSummary, getTopMenus } from "../api/endpoints/sales";
import { IngredientIcon } from "../components/dashboard/ingredient-icon";
import { MenuSharePieChart } from "../components/dashboard/menu-share-chart";
import { RevenueBarChart } from "../components/dashboard/revenue-chart";
import { DashboardShell } from "../components/dashboard/shell";
import { TableSkeleton } from "../components/dashboard/table-skeleton";

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" });

export default function HomePage() {
  const { data: summary } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: getSalesSummary,
    staleTime: 60_000,
  });
  const { data: monthly = [] } = useQuery({
    queryKey: ["sales-monthly"],
    queryFn: () => getMonthlyRevenue(6),
    staleTime: 60_000,
  });
  const { data: topMenus = [] } = useQuery({
    queryKey: ["top-menus"],
    queryFn: () => getTopMenus(5),
    staleTime: 60_000,
  });
  const { data: ingredientPrices = [] } = useQuery({
    queryKey: ["ingredient-prices"],
    queryFn: getIngredientPrices,
    staleTime: 5 * 60_000,
  });

  const hasData = (summary?.total_sales_count ?? 0) > 0;

  return (
    <DashboardShell active="home">
      <div className="space-y-10">
        <nav className="flex flex-wrap gap-3">
          <Link
            to="/settings/pos"
            className="rounded-full bg-[#7a5eff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6a4eef]"
          >
            POS 연동 설정
          </Link>
          <Link
            to="/sales/upload"
            className="rounded-full border border-[#d1d5dc] bg-white px-5 py-2.5 text-sm font-medium text-[#364153] hover:bg-[#f3f4f6]"
          >
            매출 CSV 업로드
          </Link>
        </nav>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[#364153]">실시간 최저가 추천</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ingredientPrices.map((item) => (
              <div
                key={item.item_name}
                className="flex items-center gap-3 rounded-xl border border-[#d1d5dc] bg-white p-3"
              >
                <IngredientIcon itemName={item.item_name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#364153]">{item.item_name}</p>
                  <p className="text-base font-semibold text-[#101828]">
                    {won.format(item.price)}
                    <span className="ml-1 text-xs font-normal text-[#99a1af]">/{item.unit}</span>
                  </p>
                  <p
                    className={`flex items-center gap-0.5 text-xs ${
                      item.direction === "UP"
                        ? "text-red-600"
                        : item.direction === "DOWN"
                          ? "text-blue-600"
                          : "text-[#99a1af]"
                    }`}
                  >
                    {item.direction === "UP" ? (
                      <TrendingUp className="size-3" />
                    ) : item.direction === "DOWN" ? (
                      <TrendingDown className="size-3" />
                    ) : (
                      <Minus className="size-3" />
                    )}
                    {Math.abs(item.change_percent).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#99a1af]">
            * KAMIS(한국농수산식품유통공사) 농산물 가격정보 —{" "}
            {ingredientPrices[0] ? "샘플 데이터(실 API 키 연동 전)" : "불러오는 중"}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#364153]">이번 달 매출 그래프</h2>
            <RevenueBarChart data={monthly} />
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-[#364153]">매출분석</h2>
            <div className="space-y-3 rounded-xl bg-white p-4">
              {hasData ? (
                <>
                  <div>
                    <p className="text-xs text-[#99a1af]">누적 매출</p>
                    <p className="text-lg font-semibold text-[#101828]">
                      {won.format(summary?.total_revenue ?? 0)}
                    </p>
                  </div>
                  <div className="border-t border-[#eef1f4] pt-3">
                    <p className="mb-2 text-xs text-[#99a1af]">메뉴별 매출 비중</p>
                    <MenuSharePieChart
                      topMenus={topMenus}
                      totalRevenue={summary?.total_revenue ?? 0}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#99a1af]">매출 데이터가 연결되면 표시됩니다.</p>
              )}
            </div>
          </section>
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[#364153]">재고 현황</h2>
          <TableSkeleton columns={["재료", "현재 수량", "소비기한", "위험도"]} />
          <p className="text-xs text-[#99a1af]">* 재고 관리는 준비 중입니다.</p>
        </section>
      </div>
    </DashboardShell>
  );
}
