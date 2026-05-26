// M3.F4 — 온보딩 2스텝: POS 연동 (BE M3.B6 stub 200 응답 사용).
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { FormField, Input, Select } from "../../components/ui/field";
import { posStepSchema, type PosStepValues } from "../../schemas/onboarding";
import { useOnboardingStore } from "../../stores/onboarding-store";

const POS_TYPES: Array<{ value: PosStepValues["pos_type"]; label: string }> = [
  { value: "UNIONPOS", label: "유니온포스" },
  { value: "OKPOS", label: "OKPOS" },
  { value: "POSBANK", label: "POSBANK" },
  { value: "CSV_ONLY", label: "CSV 업로드만 사용" },
];

export default function PosStep() {
  const navigate = useNavigate();
  const store = useOnboardingStore((s) => s.store);
  const draft = useOnboardingStore((s) => s.pos);
  const setPos = useOnboardingStore((s) => s.setPos);

  // 1스텝 미완료 시 진입 차단.
  if (!store) return <Navigate to="/onboarding/1" replace />;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PosStepValues>({
    resolver: zodResolver(posStepSchema),
    defaultValues: draft ?? { pos_type: "CSV_ONLY", api_key: "", store_code: "" },
    mode: "onBlur",
  });
  const posType = watch("pos_type");
  const csvOnly = posType === "CSV_ONLY";

  const onSubmit = (values: PosStepValues) => {
    setPos(values);
    navigate("/onboarding/3");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField label="POS 종류" htmlFor="pos_type" error={errors.pos_type?.message}>
        <Select id="pos_type" {...register("pos_type")}>
          {POS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        label="POS API 키"
        htmlFor="api_key"
        error={errors.api_key?.message}
        hint={csvOnly ? "CSV 업로드 모드는 자격증명 없이 진행합니다." : undefined}
      >
        <Input id="api_key" autoComplete="off" disabled={csvOnly} {...register("api_key")} />
      </FormField>
      <FormField label="매장 코드" htmlFor="store_code" error={errors.store_code?.message}>
        <Input id="store_code" autoComplete="off" disabled={csvOnly} {...register("store_code")} />
      </FormField>
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => navigate("/onboarding/1")}>
          이전
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="pos-next">
          다음
        </Button>
      </div>
    </form>
  );
}
