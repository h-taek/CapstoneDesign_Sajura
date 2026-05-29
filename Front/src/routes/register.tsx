// M3.F8 — 자체 회원가입 화면 (api_spec.md §2 POST /api/auth/register).
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { authErrorMessage, register as registerApi } from "../api/endpoints/auth";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/field";
import { type RegisterValues, registerSchema } from "../schemas/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", password_confirm: "", name: "" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) =>
      registerApi({ email: values.email, password: values.password, name: values.name }),
    onSuccess: (_data, values) => {
      navigate("/login", { replace: true, state: { registeredEmail: values.email } });
    },
    onError: async (error) => {
      setFormError(await authErrorMessage(error, "회원가입에 실패했습니다. 다시 시도해주세요."));
    },
  });

  const onSubmit = (values: RegisterValues) => {
    setFormError(null);
    mutation.mutate(values);
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">회원가입</h1>
          <p className="text-sm text-slate-500">사주라 사장님 계정 만들기</p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="이메일" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField
            label="비밀번호"
            htmlFor="password"
            error={errors.password?.message}
            hint="8자 이상"
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
          </FormField>
          <FormField
            label="비밀번호 확인"
            htmlFor="password_confirm"
            error={errors.password_confirm?.message}
          >
            <Input
              id="password_confirm"
              type="password"
              autoComplete="new-password"
              {...register("password_confirm")}
            />
          </FormField>
          <FormField label="이름" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register("name")} />
          </FormField>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "가입 중…" : "가입하기"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
