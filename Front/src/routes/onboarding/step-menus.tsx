// M3.F5 — 온보딩 3스텝: 메뉴 등록 (동적 배열, api_spec.md §4 POST /api/menus/bulk).
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { FormField, Input } from "../../components/ui/field";
import { menusStepSchema, type MenusStepValues } from "../../schemas/onboarding";
import { useOnboardingStore } from "../../stores/onboarding-store";

const EMPTY_MENU = {
  name: "",
  category: "음료",
  price: 0,
  is_active: true,
  use_inventory_deduction: true,
};

export default function MenusStep() {
  const navigate = useNavigate();
  const pos = useOnboardingStore((s) => s.pos);
  const drafts = useOnboardingStore((s) => s.menus);
  const setMenus = useOnboardingStore((s) => s.setMenus);

  if (!pos) return <Navigate to="/onboarding/2" replace />;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MenusStepValues>({
    resolver: zodResolver(menusStepSchema),
    defaultValues: { menus: drafts.length > 0 ? drafts : [{ ...EMPTY_MENU }] },
    mode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "menus" });

  const onSubmit = (values: MenusStepValues) => {
    setMenus(values.menus);
    navigate("/onboarding/4");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-3">
        {fields.map((field, idx) => {
          const rowErrors = errors.menus?.[idx];
          return (
            <div
              key={field.id}
              className="grid grid-cols-12 items-start gap-3 rounded-md border border-slate-200 p-3"
              data-testid={`menu-row-${idx}`}
            >
              <div className="col-span-4">
                <FormField label="메뉴명" htmlFor={`menus.${idx}.name`} error={rowErrors?.name?.message}>
                  <Input id={`menus.${idx}.name`} {...register(`menus.${idx}.name`)} />
                </FormField>
              </div>
              <div className="col-span-3">
                <FormField
                  label="카테고리"
                  htmlFor={`menus.${idx}.category`}
                  error={rowErrors?.category?.message}
                >
                  <Input id={`menus.${idx}.category`} {...register(`menus.${idx}.category`)} />
                </FormField>
              </div>
              <div className="col-span-3">
                <FormField label="단가(원)" htmlFor={`menus.${idx}.price`} error={rowErrors?.price?.message}>
                  <Input
                    id={`menus.${idx}.price`}
                    inputMode="numeric"
                    type="number"
                    min={0}
                    {...register(`menus.${idx}.price`)}
                  />
                </FormField>
              </div>
              <div className="col-span-2 flex justify-end pt-7">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="메뉴 삭제"
                  disabled={fields.length === 1}
                  onClick={() => remove(idx)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="col-span-12 flex gap-4 text-sm text-slate-600">
                <label className="flex items-center gap-1">
                  <input type="checkbox" {...register(`menus.${idx}.is_active`)} /> 판매 활성
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    {...register(`menus.${idx}.use_inventory_deduction`)}
                  />
                  재고 차감
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {errors.menus?.root?.message ? (
        <p className="text-xs text-red-600" role="alert">
          {errors.menus.root.message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => append({ ...EMPTY_MENU })}
        data-testid="menu-add"
      >
        <Plus className="size-4" /> 메뉴 추가
      </Button>
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={() => navigate("/onboarding/2")}>
          이전
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="menus-next">
          다음
        </Button>
      </div>
    </form>
  );
}
