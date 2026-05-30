// M4.F1 — POS 연동 설정 화면 (CSV 액션 허브).
//
// 책임 (SSOT: plan/fe/phase_04_pos.md §화면 책임 분리):
//   - 현재 연동 상태 표시 (GET /api/store/pos/status)
//   - CSV 템플릿 다운로드 (Blob 생성, BE 트래픽 0)
//   - CSV 업로드 화면 진입 (/sales/upload)
// 자격증명 입력·연결 테스트는 [2단계] POS API 연동 진입 시 추가.
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { type PosStatus, type PosStatusCode, getPosStatus } from "../../api/endpoints/pos";
import { Button } from "../../components/ui/button";

const STATUS_LABEL: Record<PosStatusCode, { ko: string; tone: string }> = {
  CSV_MODE: { ko: "CSV 업로드 모드", tone: "bg-blue-50 text-blue-700 ring-blue-200" },
  CONNECTED: { ko: "정상 연동", tone: "bg-green-50 text-green-700 ring-green-200" },
  ERROR: { ko: "연동 오류", tone: "bg-red-50 text-red-700 ring-red-200" },
  DISCONNECTED: { ko: "미연동", tone: "bg-slate-50 text-slate-600 ring-slate-200" },
};

// CSV 템플릿 헤더 — feature_spec §4.4 + api_spec §6.
// 컬럼명은 점주가 자유롭게 매핑할 수 있지만, 다운로드 템플릿은 사주라
// 기본 컬럼명을 따른다(업로드 화면 기본값과 일치).
const TEMPLATE_HEADER = "날짜,메뉴명,수량,금액,영수증번호";
const TEMPLATE_SAMPLES = [
  "2026-01-15 14:30:00,아메리카노,3,13500,rcpt-0001",
  "2026-01-15 14:32:00,카페라떼,1,5500,rcpt-0002",
];

function downloadTemplate() {
  // UTF-8 BOM을 붙여 엑셀에서 한글 깨짐 방지.
  const csv = `﻿${TEMPLATE_HEADER}\n${TEMPLATE_SAMPLES.join("\n")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PosSettingsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery<PosStatus>({
    queryKey: ["pos-status"],
    queryFn: getPosStatus,
    staleTime: 60_000,
  });

  return (
    <main className="min-h-dvh bg-slate-50 p-6">
      <header className="mx-auto max-w-3xl pb-6">
        <h1 className="text-xl font-semibold text-slate-900">POS 연동 설정</h1>
        <p className="text-sm text-slate-500">
          현재 매장의 POS 연동 상태와 CSV 업로드 도구를 한곳에서 관리합니다.
        </p>
      </header>

      <section className="mx-auto max-w-3xl space-y-4">
        <article className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-500">현재 연동 상태</h2>
          {isLoading ? (
            <p className="mt-2 text-slate-400">불러오는 중…</p>
          ) : isError ? (
            <div className="mt-2 flex items-center gap-3">
              <p className="text-red-600">상태를 불러오지 못했습니다.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : data ? (
            <StatusBadge status={data} />
          ) : null}
        </article>

        <article className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">CSV 업로드</h2>
          <p className="mt-1 text-sm text-slate-500">
            보유한 POS 매출 데이터를 사주라 양식의 CSV 파일로 변환해 업로드합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadTemplate}>
              CSV 템플릿 다운로드
            </Button>
            <Button onClick={() => navigate("/sales/upload")}>
              업로드 화면으로 이동
            </Button>
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-500">
            <li>UTF-8 CSV 형식만 지원합니다 (Excel은 .xlsx 미지원).</li>
            <li>최대 50 MB까지 업로드할 수 있습니다.</li>
            <li>같은 영수증번호가 이미 등록되어 있으면 자동으로 건너뜁니다.</li>
          </ul>
        </article>

        <article className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
          외부 POS API 연동(TossPlace·키움페이·OKPOS)은 2단계에서 제공될 예정입니다.
        </article>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: PosStatus }) {
  const { ko, tone } = STATUS_LABEL[status.status];
  return (
    <div className="mt-2 space-y-2">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${tone}`}
      >
        {ko}
      </span>
      {status.last_synced_at && (
        <p className="text-xs text-slate-500">
          마지막 동기화: {new Date(status.last_synced_at).toLocaleString("ko-KR")}
        </p>
      )}
      {status.error_message && (
        <p className="text-xs text-red-600">{status.error_message}</p>
      )}
    </div>
  );
}
