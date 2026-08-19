import { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, Eye, EyeOff, UploadCloud, CheckCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const registerSchema = z.object({
  workshopName: z.string().min(1, 'Workshop name is required'),
  address: z.string().min(1, 'Address is required'),
  bays: z.number().min(1, 'At least 1 bay is required'),
  ownerName: z.string().min(1, 'Owner name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const setAuth = useAuthStore(state => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues
  } = useRHForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      bays: 1
    }
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setGlobalError(null);
      setAuth(data);
      navigate({ to: '/dashboard' });
    },
    onError: (error: unknown) => {
      setGlobalError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to register. Please try again.');
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    mutation.mutate({
      ...data,
      services: ['General Repair', 'Diagnostics'] // Default mock services
    });
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isStep1Valid = await trigger(['workshopName', 'address', 'bays']);
      if (isStep1Valid) setStep(2);
    } else if (step === 2) {
      const isStep2Valid = await trigger(['ownerName', 'email', 'password']);
      if (isStep2Valid) setStep(3); // Go to Plan selection (mocked for now, will auto submit)
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-white font-inter">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex w-133.25 bg-[#FFE9E2] border-r border-[#E3BFB1] flex-col relative overflow-hidden">
        {/* Atmospheric Image */}
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
        
        {/* Brand Logo Anchor */}
        <div className="relative flex items-center gap-2 p-8 z-10">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L2 9L16 16L30 9L16 2Z" fill="#A33E00"/>
            <path d="M2 23L16 30L30 23V9L16 16L2 9V23Z" fill="#A33E00" fillOpacity="0.8"/>
          </svg>
          <span className="font-manrope font-bold text-2xl text-warning-orange">GoMech</span>
        </div>

        {/* Overlay Text */}
        <div className="relative mt-auto p-8 pt-16 pb-16 bg-linear-to-t from-[#FFE9E2] to-transparent z-10">
          <h2 className="font-manrope font-bold text-[32px] leading-10 text-charcoal-900 mb-2">Precision in every bay.</h2>
          <p className="text-[#5A4136] text-base leading-6 max-w-md">Join thousands of high-performance workshops managing jobs, inventory, and clients with industrial-grade tools.</p>
        </div>
      </div>

      {/* Right Wizard Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-140 flex flex-col">
          
          {/* Progress Indicator */}
          <div className="flex flex-col gap-4 mb-8">
            <span className="font-inter font-semibold text-[11px] leading-3.5 tracking-widest uppercase text-[#5A4136]">
              STEP {step} OF 3
            </span>
            <div className="flex gap-2 w-full">
              <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-warning-orange' : 'bg-[#F8DDD2]'}`}></div>
              <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-warning-orange' : 'bg-[#F8DDD2]'}`}></div>
              <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-warning-orange' : 'bg-[#F8DDD2]'}`}></div>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-1 mb-8">
            <h1 className="font-manrope font-bold text-[32px] leading-10 text-[#271812]">
              {step === 1 && "Workshop Profile"}
              {step === 2 && "Owner Details"}
              {step === 3 && "Select Plan"}
            </h1>
            <p className="font-inter text-base text-[#5A4136]">
              {step === 1 && "Let's set up the core identity of your service center."}
              {step === 2 && "Create your administrator account."}
              {step === 3 && "Choose the best plan for your needs."}
            </p>
          </div>

          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-3 text-sm mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            
            {step === 1 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Logo Upload */}
                <div className="flex items-center gap-4 p-4 bg-[#FFF8F6] border border-dashed border-[#E3BFB1] rounded-lg">
                  <div className="w-16 h-16 bg-[#F8DDD2] rounded-xl flex items-center justify-center">
                    <UploadCloud className="text-[#5A4136]" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-inter font-medium text-[13px] text-[#271812]">Upload Workshop Logo</span>
                    <span className="font-inter text-xs text-[#5A4136]">Drag and drop or click to browse. Recommended size: 256x256px (PNG, JPG).</span>
                  </div>
                </div>

                {/* Workshop Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Workshop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Auto Repair"
                    className="w-full h-12 bg-[#FFF8F6] border border-[#E3BFB1] rounded px-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    {...register('workshopName')}
                  />
                  {errors.workshopName && <span className="text-xs text-red-500">{errors.workshopName.message}</span>}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Primary Address</label>
                  <textarea
                    placeholder="Full street address..."
                    className="w-full h-24 bg-[#FFF8F6] border border-[#E3BFB1] rounded p-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)] resize-none"
                    {...register('address')}
                  />
                  {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
                </div>

                {/* Bays */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Number of Service Bays</label>
                  <input
                    type="number"
                    min="1"
                    className="w-32 h-12 bg-[#FFF8F6] border border-[#E3BFB1] rounded px-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    {...register('bays', { valueAsNumber: true })}
                  />
                  {errors.bays && <span className="text-xs text-red-500">{errors.bays.message}</span>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Owner Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full h-12 bg-[#FFF8F6] border border-[#E3BFB1] rounded px-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    {...register('ownerName')}
                  />
                  {errors.ownerName && <span className="text-xs text-red-500">{errors.ownerName.message}</span>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@workshop.com"
                    className="w-full h-12 bg-[#FFF8F6] border border-[#E3BFB1] rounded px-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    {...register('email')}
                  />
                  {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter font-medium text-[13px] text-[#271812]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full h-12 bg-[#FFF8F6] border border-[#E3BFB1] rounded px-4 text-sm text-[#271812] outline-none focus:border-warning-orange focus:ring-1 focus:ring-warning-orange shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A4136]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 border border-[#E3BFB1] rounded-lg bg-[#FFF8F6] flex flex-col items-center gap-4">
                  <CheckCircle className="text-[#00AD4E] w-12 h-12" />
                  <h3 className="font-manrope font-bold text-xl text-[#271812]">Pro Plan Selected</h3>
                  <p className="text-center text-[#5A4136] text-sm">You are setting up: <br/><strong className="text-warning-orange">{getValues('workshopName')}</strong></p>
                  <div className="w-full h-px bg-[#E3BFB1] my-2"></div>
                  <p className="text-center text-[#5A4136] text-sm">Click Complete Registration to finalize and go to your new dashboard!</p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 pt-8 border-t border-[#E3BFB1] flex justify-between items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="h-12 px-6 bg-white border border-[#E3BFB1] text-[#271812] font-inter font-medium text-[13px] rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="h-12 px-8 bg-warning-orange text-white font-inter font-medium text-[13px] rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-warning-orange-hover transition-colors flex items-center gap-2"
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="h-12 px-8 bg-[#00AD4E] text-white font-inter font-medium text-[13px] rounded shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#009643] transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {mutation.isPending ? 'Completing...' : 'Complete Registration'}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
