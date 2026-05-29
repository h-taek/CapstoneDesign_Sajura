// M3.F1 + M3.F8 — 로그인 화면 (OAuth 버튼 + 이메일/비밀번호 폼).
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { authErrorMessage, fetchMe, loginWithEmail, oauthLoginUrl } from "../api/endpoints/auth";
import { Button } from "../components/ui/button";
import { FormField, Input } from "../components/ui/field";
import { type LoginValues, loginSchema } from "../schemas/auth";
import { useAuthStore } from "../stores/auth-store";
import { landingPath } from "./guards";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = (location.state as { registeredEmail?: string } | null)?.registeredEmail;
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: registeredEmail ?? "", password: "" },
    mode: "onBlur",
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const tokens = await loginWithEmail(values.email, values.password);
      setAccessToken(tokens.access_token);
      const me = await fetchMe();
      setUser(me);
      return me;
    },
    onSuccess: (me) => {
      navigate(landingPath(me), { replace: true });
    },
    onError: async (error) => {
      setFormError(await authErrorMessage(error, "로그인에 실패했습니다."));
    },
  });

  const onSubmit = (values: LoginValues) => {
    setFormError(null);
    mutation.mutate(values);
  };

  const goKakao = () => window.location.assign(oauthLoginUrl("kakao"));
  const goGoogle = () => window.location.assign(oauthLoginUrl("google"));

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">사주라</h1>
          <p className="text-sm text-slate-500">소상공인 재고/발주 PWA</p>
        </header>

        {registeredEmail ? (
          <output className="block rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            회원가입이 완료되었습니다. 로그인해주세요.
          </output>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="이메일" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </FormField>
          <FormField label="비밀번호" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </FormField>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "로그인 중…" : "로그인"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          계정이 없으신가요?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            회원가입
          </Link>
        </p>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">또는</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="w-full bg-[#FEE500] text-slate-900 hover:bg-[#FADA0A]"
            onClick={goKakao}
            data-provider="kakao"
          >
            카카오로 계속하기
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={goGoogle}
            data-provider="google"
          >
            Google로 계속하기
          </Button>
        </div>

        <p className="text-center text-xs text-slate-400">
          계속 진행 시 서비스 약관·개인정보 처리방침에 동의한 것으로 간주됩니다.
        </p>
      </section>
    </main>
  );
}
