import { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useRHForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setGlobalError(null);
      setAuth(data);
      navigate({ to: '/dashboard' });
    },
    onError: (error: unknown) => {
      setGlobalError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Falha ao autenticar. Verifique suas credenciais.');
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="relative w-full max-w-110 px-4 mx-auto">
      {/* Blurred Backgrounds */}
      <div className="absolute -top-25 -right-25 w-lg h-102.25 bg-[#FF6500]/20 blur-[120px] rounded-xl pointer-events-none" />
      <div className="absolute -bottom-25 -left-25 w-[384px] h-76.75 bg-[#00AD4E]/10 blur-[100px] rounded-xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="relative z-10 flex flex-col gap-6">
        <div className="bg-white border border-[#E3BFB1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg p-8 flex flex-col gap-8">
          
          <div className="flex flex-col items-center gap-2">
            <div className="pb-2">
              <div className="h-12 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="#A33E00"/>
                  <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="#A33E00" fillOpacity="0.8"/>
                </svg>
              </div>
            </div>
            <h1 className="font-manrope font-semibold text-2xl leading-8 text-[#271812] text-center">Welcome back</h1>
            <p className="font-inter text-sm leading-5 text-[#5A4136] text-center">Sign in to your GoMech workspace.</p>
          </div>

          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-medium text-[13px] leading-4 text-[#271812]">Email address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    className="w-full h-12 bg-white border border-[#E3BFB1] rounded text-sm text-[#8E7164] px-4 outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange"
                    {...register('email')}
                  />
                  {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-inter font-medium text-[13px] leading-4 text-[#271812]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full h-12 bg-white border border-[#E3BFB1] rounded text-sm text-[#8E7164] px-4 outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A4136]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
                </div>
              </div>

              <div className="flex justify-between items-center h-5 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded-sm border-[#E3BFB1] text-warning-orange focus:ring-warning-orange" />
                  <span className="font-inter text-xs text-[#5A4136]">Remember me</span>
                </label>
                <a href="#" className="font-inter font-medium text-[13px] text-warning-orange hover:underline">Forgot Password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 w-full bg-warning-orange text-white font-inter font-medium text-[13px] rounded flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#8B3500] transition-colors disabled:opacity-70"
            >
              {mutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#E3BFB1]"></div>
            <span className="font-inter text-xs text-[#5A4136]">Or continue with</span>
            <div className="flex-1 h-px bg-[#E3BFB1]"></div>
          </div>

          <div className="flex gap-4">
            <button type="button" className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border border-[#E3BFB1] rounded hover:bg-gray-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10.03H12V14.23H17.92C17.67 15.6 16.9 16.74 15.75 17.51V20.24H19.32C21.41 18.32 22.56 15.54 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.32 20.24L15.75 17.51C14.74 18.19 13.48 18.6 12 18.6C9.13 18.6 6.7 16.66 5.82 14.05H2.14V16.9C4.01 20.61 7.74 23 12 23Z" fill="#34A853"/>
                <path d="M5.82 14.05C5.59 13.38 5.46 12.7 5.46 12C5.46 11.3 5.59 10.62 5.82 9.95V7.1H2.14C1.36 8.65 0.91 10.28 0.91 12C0.91 13.72 1.36 15.35 2.14 16.9L5.82 14.05Z" fill="#FBBC05"/>
                <path d="M12 5.4C13.62 5.4 15.06 5.96 16.2 7.05L19.4 3.85C17.46 2.03 14.97 0.999999 12 0.999999C7.74 0.999999 4.01 3.39 2.14 7.1L5.82 9.95C6.7 7.34 9.13 5.4 12 5.4Z" fill="#EA4335"/>
              </svg>
              <span className="font-inter font-medium text-[13px] text-[#271812]">Google</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center gap-1">
          <span className="font-inter text-sm text-[#5A4136]">Don't have an account?</span>
          <Link to="/register" className="font-inter font-medium text-[13px] text-warning-orange hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
