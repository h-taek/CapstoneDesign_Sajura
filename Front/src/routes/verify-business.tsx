// M3.F9 — 사업자 검증 화면 (온보딩 진입 전 게이트, api_spec.md §3).
// 사업자번호 + 사업자등록증 업로드 → POST /api/store/business/verify (multipart).
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { authErrorMessage, fetchMe, verifyBusiness } from "../api/endpoints/auth";
import { getStore } from "../api/endpoints/store";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/field";
import { type VerifyBusinessValues, formatBusinessNo, verifyBusinessSchema } from "../schemas/auth";
import { useAuthStore } from "../stores/auth-store";
import { landingPath } from "./guards";

export default function VerifyBusinessPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [cert, setCert] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 반려 상태면 사유 표시 (GET /api/store).
  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: getStore,
    enabled: user?.business_status === "REJECTED",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyBusinessValues>({
    resolver: zodResolver(verifyBusinessSchema),
    defaultValues: { business_no: "" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: async (values: VerifyBusinessValues) => {
      await verifyBusiness(values.business_no, cert);
      const me = await fetchMe();
      setUser(me);
      return me;
    },
    onSuccess: (me) => navigate(landingPath(me), { replace: true }),
    onError: async (error) => {
      setFormError(await authErrorMessage(error, "사업자 검증에 실패했습니다."));
    },
  });

  const onSubmit = (values: VerifyBusinessValues) => {
    setFormError(null);
    if (!cert) {
      setFormError("사업자등록증 파일을 첨부하세요.");
      return;
    }
    mutation.mutate(values);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">사업자 인증</h1>
          <p className="text-sm text-slate-500">
            사업자등록번호와 등록증을 제출하면 검증 후 매장 설정으로 진행합니다.
          </p>
        </header>

        {user?.business_status === "REJECTED" && store?.business_reject_reason ? (
          <output className="block rounded-md bg-red-50 p-3 text-sm text-red-700">
            반려됨: {store.business_reject_reason} — 확인 후 다시 제출해주세요.
          </output>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="사업자등록번호"
            htmlFor="business_no"
            error={errors.business_no?.message}
            hint="123-45-67890"
          >
            <Input
              id="business_no"
              inputMode="numeric"
              {...register("business_no", {
                onChange: (e) => setValue("business_no", formatBusinessNo(e.target.value)),
              })}
            />
          </FormField>

          <FormField label="사업자등록증" htmlFor="cert" hint="이미지(jpg/png) 또는 PDF, 최대 10MB">
            <input
              id="cert"
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setCert(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
            />
          </FormField>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "검증 중…" : "제출하기"}
          </Button>
        </form>
      </section>
    </main>
  );
}
