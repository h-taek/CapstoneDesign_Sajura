// 월별 매출·판매건수 막대그래프 — Figma "매출 그래프" 자리에 실제 GET /api/sales/monthly 데이터로 렌더링.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyRevenuePoint } from "../../api/endpoints/sales";

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" });

export function RevenueBarChart({
  data,
  metric = "revenue",
  emptyLabel = "매출 데이터가 연결되면 표시됩니다.",
}: {
  data: MonthlyRevenuePoint[];
  metric?: "revenue" | "sales_count";
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-[#d1d5dc] bg-white text-sm text-[#99a1af]">
        {emptyLabel}
      </div>
    );
  }

  const isRevenue = metric === "revenue";

  return (
    <div className="h-[220px] rounded-xl bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef1f4" />
          <XAxis
            dataKey="year_month"
            tick={{ fontSize: 12, fill: "#9ba5b7" }}
            axisLine={{ stroke: "#eef1f4" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ba5b7" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) => (isRevenue ? `${Math.round(v / 10000)}만` : `${v}`)}
          />
          <Tooltip
            formatter={(value: number) => (isRevenue ? won.format(value) : `${value}건`)}
            labelFormatter={(label) => `${label}`}
            contentStyle={{ borderRadius: 8, borderColor: "#eef1f4", fontSize: 12 }}
          />
          <Bar dataKey={metric} fill="#7a5eff" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
