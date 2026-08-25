// Figma의 Table 컴포넌트(헤더 행 + "----" 자리표시 행) 모양을 그대로 재현한 스켈레톤.
// 실데이터가 없는 기능(최저가 추천·재고 현황 등)에서 빈 상자 대신 이 형태로 "준비 중"을 표시한다.
export function TableSkeleton({ columns, rows = 3 }: { columns: string[]; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d1d5dc]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((col) => (
          <div
            key={col}
            className="border-b border-r border-[#d1d5dc] bg-[#fafafa] px-3 py-2 text-sm font-medium text-[#61646b] last:border-r-0"
          >
            {col}
          </div>
        ))}
        {Array.from({ length: rows }).map((_, rowIdx) =>
          columns.map((col) => (
            <div
              key={`${rowIdx}-${col}`}
              className="border-r border-b border-[#d1d5dc] px-3 py-2 text-sm text-[#afb1b6] last:border-r-0"
            >
              ----
            </div>
          )),
        )}
      </div>
    </div>
  );
}
