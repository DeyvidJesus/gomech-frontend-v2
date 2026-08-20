import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setGlobalError(null);
      setAuth(data.accessToken, data.refreshToken, data.user);
      navigate({ to: '/dashboard' });
    },
    onError: (error: unknown) => {
      const handled = handleApiValidationErrors(error, setError);
      if (!handled) {
        setGlobalError(getApiErrorMessage(error, 'Credenciais inválidas. Verifique seu e-mail e senha.'));
      }
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: () => authApi.getGoogleAuthorizeUrl(),
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    },
    onError: (error: unknown) => {
      setGlobalError(getApiErrorMessage(error, 'Não foi possível iniciar o login com o Google.'));
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setGlobalError(null);
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="w-full max-w-[440px] px-md relative z-10">
      {/* Login Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-xl flex flex-col gap-xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-sm">
          <div className="h-12 mb-2 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined icon-fill text-[28px] text-white">
                precision_manufacturing
              </span>
            </div>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-bold">Bem-vindo de volta</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Acesse seu espaço de trabalho GoMech.</p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="bg-error-container/60 border border-error/40 text-on-error-container px-4 py-3 rounded-lg flex items-center gap-3 text-body-sm animate-in fade-in">
            <span className="material-symbols-outlined text-error text-[20px] shrink-0">error</span>
            <span>{globalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg" noValidate>
          {/* Email Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
              Endereço de e-mail
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                mail
              </span>
              <input
                id="email"
                type="email"
                placeholder="nome@empresa.com.br"
                className={`w-full h-[48px] pl-10 pr-md rounded-lg border bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-outline ${
                  errors.email ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-body-sm text-[12px] text-error font-medium">{errors.email.message}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={`w-full h-[48px] pl-10 pr-[40px] rounded-lg border bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-outline ${
                  errors.password ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && (
              <span className="text-body-sm text-[12px] text-error font-medium">{errors.password.message}</span>
            )}
          </div>

          {/* Remember & Forgot Password */}
          <div className="flex items-center justify-between mt-[-8px]">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer appearance-none w-4 h-4 border border-outline-variant rounded bg-surface-container-lowest checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary-fixed focus:ring-offset-1 focus:ring-offset-surface-container-lowest transition-all cursor-pointer"
                  {...register('rememberMe')}
                />
                <span className="material-symbols-outlined absolute text-[12px] text-on-primary opacity-0 peer-checked:opacity-100 pointer-events-none">
                  check
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                Lembrar de mim
              </span>
            </label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
            >
              Esqueceu a senha?
            </a>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-[48px] flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container active:translate-y-[1px] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-md">
          <div className="h-px bg-outline-variant flex-1"></div>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Ou continue com</span>
          <div className="h-px bg-outline-variant flex-1"></div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-md">
          <button
            type="button"
            onClick={() => googleAuthMutation.mutate()}
            disabled={googleAuthMutation.isPending}
            className="h-[48px] flex items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors active:translate-y-[1px] disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            className="h-[48px] flex items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors active:translate-y-[1px]"
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.76.04 3.19.78 4.07 2.11-3.4 2.16-2.88 6.57.51 7.9-1.02 2.38-2.14 4.07-3.25 5.23v-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-lg text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Não tem uma conta?{' '}
          <Link
            to="/register"
            className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors font-semibold"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
