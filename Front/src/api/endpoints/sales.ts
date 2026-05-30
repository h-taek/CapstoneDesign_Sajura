// 판매 데이터 업로드 API — api_spec.md §6.
import { api } from "../../lib/api";

export interface CSVUploadResponse {
  imported: number;
  skipped: number;
  skipped_reasons: string[];
  anomaly_count: number;
}

export interface CSVUploadColumns {
  date_column: string;
  menu_column: string;
  quantity_column: string;
  price_column: string;
  external_sale_id_column?: string | null;
}

export async function uploadSalesCsv(
  file: File,
  columns: CSVUploadColumns,
): Promise<CSVUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("date_column", columns.date_column);
  form.append("menu_column", columns.menu_column);
  form.append("quantity_column", columns.quantity_column);
  form.append("price_column", columns.price_column);
  if (columns.external_sale_id_column) {
    form.append("external_sale_id_column", columns.external_sale_id_column);
  }
  // 업로드는 시간이 걸릴 수 있어 ky 기본 타임아웃(10s)을 늘림.
  return api
    .post("sales/upload", { body: form, timeout: 120_000 })
    .json<CSVUploadResponse>();
}
