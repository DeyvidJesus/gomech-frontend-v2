import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';

const registerSchema = z.object({
  // Step 1: Owner & Account
  ownerName: z.string().min(2, 'Nome completo deve ter no mínimo 2 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Você deve concordar com os Termos de Serviço',
  }),

  // Step 2: Workshop Profile
  workshopName: z.string().min(2, 'Nome da oficina deve ter no mínimo 2 caracteres'),
  address: z.string().min(5, 'Endereço completo é obrigatório'),
  bays: z.number().min(1, 'Informe ao menos 1 box de atendimento'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const DEFAULT_SERVICES = [
  'Mecânica Geral',
  'Diagnóstico Computadorizado',
  'Funilaria & Pintura',
  'Pneus & Alinhamento',
  'Revisão Preventiva',
  'Injeção Eletrônica',
];

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ELITE'>('PRO');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Mecânica Geral',
    'Diagnóstico Computadorizado',
    'Revisão Preventiva',
  ]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      terms: false,
      workshopName: '',
      address: '',
      bays: 4,
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setGlobalError(null);
      setAuth(data.accessToken, data.refreshToken, data.user);
      navigate({ to: '/dashboard' });
    },
    onError: (error: unknown) => {
      const handled = handleApiValidationErrors(error, setError);
      if (!handled) {
        setGlobalError(getApiErrorMessage(error, 'Erro ao criar conta da oficina. Tente novamente.'));
      }
    },
  });

  // Step 1 -> Step 2 validation
  const handleGoToStep2 = async () => {
    setGlobalError(null);
    const isValid = await trigger(['ownerName', 'email', 'phone', 'password', 'terms']);
    if (isValid) {
      setStep(2);
    }
  };

  // Step 2 -> Step 3 validation
  const handleGoToStep3 = async () => {
    setGlobalError(null);
    const isValid = await trigger(['workshopName', 'address', 'bays']);
    if (isValid) {
      setStep(3);
    }
  };

  // Submit on Step 3 (Plan selection)
  const handlePlanSelectionAndSubmit = (plan: 'STARTER' | 'PRO' | 'ELITE') => {
    setSelectedPlan(plan);
    setGlobalError(null);
    const values = getValues();

    registerMutation.mutate({
      workshopName: values.workshopName,
      address: values.address,
      bays: values.bays,
      services: selectedServices.length > 0 ? selectedServices : ['Mecânica Geral'],
      ownerName: values.ownerName,
      email: values.email,
      password: values.password,
    });
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleAddCustomService = () => {
    if (customServiceInput.trim()) {
      const trimmed = customServiceInput.trim();
      if (!selectedServices.includes(trimmed)) {
        setSelectedServices((prev) => [...prev, trimmed]);
      }
      setCustomServiceInput('');
      setShowCustomServiceInput(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-surface-container-lowest font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Split Screen Layout for Steps 1 & 2 */}
      {step !== 3 ? (
        <div className="flex w-full min-h-screen">
          {/* Left Column: Form Canvas */}
          <div className="w-full lg:w-[500px] xl:w-[580px] shrink-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 relative z-10 bg-surface-container-lowest overflow-y-auto">
            <div className="w-full mx-auto lg:mx-0">
              {/* Top Step Progress Header */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full font-label-sm text-[11px] font-bold ${
                      step >= 1 ? 'bg-primary text-on-primary' : 'border border-outline text-on-surface'
                    }`}
                  >
                    1
                  </span>
                  <span
                    className={`font-label-md text-label-md ${
                      step === 1 ? 'text-primary font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    Conta
                  </span>
                </div>

                <div className="h-px w-6 bg-outline-variant"></div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full font-label-sm text-[11px] font-bold ${
                      step >= 2 ? 'bg-primary text-on-primary' : 'border border-outline text-on-surface'
                    }`}
                  >
                    2
                  </span>
                  <span
                    className={`font-label-md text-label-md ${
                      step === 2 ? 'text-primary font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    Oficina
                  </span>
                </div>

                <div className="h-px w-6 bg-outline-variant"></div>

                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full border border-outline font-label-sm text-[11px]">
                    3
                  </span>
                  <span className="font-label-md text-label-md text-on-surface">Plano</span>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
                    <span className="material-symbols-outlined text-[24px] text-white">
                      precision_manufacturing
                    </span>
                  </div>
                  <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                    GoMech
                  </span>
                </div>

                {step === 1 ? (
                  <>
                    <h1 className="font-display-lg text-[32px] sm:text-[36px] font-bold text-on-surface mb-1 tracking-tight leading-tight">
                      Criar Conta GoMech
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Configure seu espaço de trabalho profissional para sua oficina.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="font-display-lg text-[32px] sm:text-[36px] font-bold text-on-surface mb-1 tracking-tight leading-tight">
                      Dados da Oficina
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Defina a identidade e capacidade de atendimento da unidade.
                    </p>
                  </>
                )}
              </div>

              {/* Global Error Banner */}
              {globalError && (
                <div className="mb-6 bg-error-container/60 border border-error/40 text-on-error-container px-4 py-3 rounded-lg flex items-center gap-3 text-body-sm animate-in fade-in">
                  <span className="material-symbols-outlined text-error text-[20px] shrink-0">error</span>
                  <span>{globalError}</span>
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit(() => {})} className="flex flex-col gap-4" noValidate>
                {/* STEP 1: Owner & Account */}
                {step === 1 && (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                    {/* Full Name */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="ownerName">
                        Nome Completo do Proprietário <span className="text-primary">*</span>
                      </label>
                      <input
                        id="ownerName"
                        type="text"
                        placeholder="Ex: Carlos Alberto Silva"
                        className={`h-[48px] px-md rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
                          errors.ownerName ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                        }`}
                        {...register('ownerName')}
                      />
                      {errors.ownerName && (
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.ownerName.message}
                        </span>
                      )}
                    </div>

                    {/* Work Email */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                        E-mail Profissional <span className="text-primary">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="carlos@suaoficina.com.br"
                        className={`h-[48px] px-md rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
                          errors.email ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                        }`}
                        {...register('email')}
                      />
                      {errors.email && (
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.email.message}
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="phone">
                        Telefone / WhatsApp
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+55 (11) 98765-4321"
                        className="h-[48px] px-md rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all"
                        {...register('phone')}
                      />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                        Senha de Acesso <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className={`w-full h-[48px] px-md pr-[40px] rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
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
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.password.message}
                        </span>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-sm mt-1">
                      <div className="flex h-6 items-center">
                        <input
                          id="terms"
                          type="checkbox"
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 bg-surface-container-lowest transition-colors cursor-pointer"
                          {...register('terms')}
                        />
                      </div>
                      <div className="text-sm leading-6">
                        <label
                          className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer"
                          htmlFor="terms"
                        >
                          Concordo com os{' '}
                          <a href="#" className="text-primary hover:underline font-medium">
                            Termos de Serviço
                          </a>{' '}
                          e{' '}
                          <a href="#" className="text-primary hover:underline font-medium">
                            Política de Privacidade
                          </a>
                          .
                        </label>
                        {errors.terms && (
                          <p className="text-body-sm text-[12px] text-error font-medium block">
                            {errors.terms.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Continue Button */}
                    <button
                      type="button"
                      onClick={handleGoToStep2}
                      className="mt-3 h-[48px] w-full rounded-lg flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container active:translate-y-[1px] transition-all duration-150 shadow-sm font-bold"
                    >
                      <span>Continuar: Dados da Oficina</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                )}

                {/* STEP 2: Workshop Profile */}
                {step === 2 && (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                    {/* Logo Upload Box */}
                    <label className="group border border-dashed border-outline-variant rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-surface-container-low hover:border-primary transition-colors bg-surface">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <div className="w-14 h-14 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors shrink-0 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface font-semibold">
                          {logoPreview ? 'Logo Carregada' : 'Logo da Oficina'}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                          Clique para selecionar (PNG ou JPG até 2MB).
                        </p>
                      </div>
                    </label>

                    {/* Workshop Name */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="workshopName">
                        Nome Fantasia da Oficina <span className="text-primary">*</span>
                      </label>
                      <input
                        id="workshopName"
                        type="text"
                        placeholder="Ex: Turbo Power Auto Center"
                        className={`h-[48px] px-md rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
                          errors.workshopName ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                        }`}
                        {...register('workshopName')}
                      />
                      {errors.workshopName && (
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.workshopName.message}
                        </span>
                      )}
                    </div>

                    {/* Primary Address */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="address">
                        Endereço Completo da Matriz <span className="text-primary">*</span>
                      </label>
                      <input
                        id="address"
                        type="text"
                        placeholder="Ex: Av. das Américas, 1000 - Barra da Tijuca, RJ"
                        className={`h-[48px] px-md rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
                          errors.address ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                        }`}
                        {...register('address')}
                      />
                      {errors.address && (
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.address.message}
                        </span>
                      )}
                    </div>

                    {/* Service Bays */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface" htmlFor="bays">
                        Boxes / Elevadores de Atendimento <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                          garage
                        </span>
                        <input
                          id="bays"
                          type="number"
                          min={1}
                          max={50}
                          placeholder="4"
                          className={`w-full h-[48px] pl-10 pr-md rounded-lg border bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-all ${
                            errors.bays ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                          }`}
                          {...register('bays', { valueAsNumber: true })}
                        />
                      </div>
                      {errors.bays && (
                        <span className="text-body-sm text-[12px] text-error font-medium">
                          {errors.bays.message}
                        </span>
                      )}
                    </div>

                    {/* Main Services (Pills) */}
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-md text-label-md text-on-surface">
                        Principais Serviços Prestados
                      </label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {DEFAULT_SERVICES.map((srv) => {
                          const isSelected = selectedServices.includes(srv);
                          return (
                            <button
                              key={srv}
                              type="button"
                              onClick={() => toggleService(srv)}
                              className={`px-3 py-1.5 rounded-full font-label-sm text-[11px] transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                                  : 'bg-surface border border-outline-variant text-on-surface-variant hover:border-primary'
                              }`}
                            >
                              {isSelected && (
                                <span className="material-symbols-outlined text-[14px]">check</span>
                              )}
                              {srv}
                            </button>
                          );
                        })}

                        {/* Custom Added Services */}
                        {selectedServices
                          .filter((s) => !DEFAULT_SERVICES.includes(s))
                          .map((customSrv) => (
                            <button
                              key={customSrv}
                              type="button"
                              onClick={() => toggleService(customSrv)}
                              className="px-3 py-1.5 rounded-full font-label-sm text-[11px] bg-primary text-on-primary font-bold shadow-xs flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              {customSrv}
                            </button>
                          ))}

                        {/* Add custom service button */}
                        {!showCustomServiceInput ? (
                          <button
                            type="button"
                            onClick={() => setShowCustomServiceInput(true)}
                            className="px-3 py-1.5 rounded-full font-label-sm text-[11px] border border-dashed border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Personalizado
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Outro serviço..."
                              value={customServiceInput}
                              onChange={(e) => setCustomServiceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomService();
                                }
                              }}
                              className="h-7 px-2 border border-primary rounded-lg text-[11px] bg-surface text-on-surface outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomService}
                              className="px-2 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-bold"
                            >
                              Adicionar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 2 Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-[48px] px-5 rounded-lg border border-outline-variant bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToStep3}
                        className="flex-1 h-[48px] rounded-lg flex items-center justify-center gap-2 bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container active:translate-y-[1px] transition-all duration-150 shadow-sm font-bold"
                      >
                        <span>Escolher Plano</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Já possui uma conta?{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Cinematic Brand Illustration */}
          <div className="hidden lg:flex flex-1 relative bg-inverse-surface items-center justify-center overflow-hidden border-l border-outline-variant">
            <img
              alt="Modern automotive workshop"
              className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0N7SsS-O4zHN-npd1PALSuWbjEgw-lxlOafUhlokBEp_zJcyc77PqRDf30svppKAzSuv7C-JzZ5kzVwgJg2aRDbijKH9VBVLOgaqyUkpr_uJVA2Wwfc1OYiIeYZ91vMm6C0ttfRiuwlPBJnunTBQUOQlnfeSXdU1ImPjezZ-zfxjw8-XsJf7B8pE5XVWLBQU6DTnI6Nq-bOQ9Ua9ZzFGwv9lcs1CQ9-hTh1PghrynwyV2a5_ZJ5M-B3AsG9JMiMwuxBCNjmQmjEw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/95 via-inverse-surface/50 to-transparent"></div>

            <div className="relative z-10 w-full px-12 xl:px-16 self-end pb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest/10 border border-outline-variant/30 backdrop-blur-sm mb-6">
                <span className="material-symbols-outlined text-primary-fixed text-[18px]">verified</span>
                <span className="font-label-sm text-label-sm text-inverse-on-surface tracking-wider uppercase font-semibold">
                  Enterprise Grade
                </span>
              </div>

              <h2 className="font-manrope text-3xl xl:text-4xl font-bold text-inverse-on-surface mb-4 leading-tight">
                Modernizando a gestão da
                <br />
                sua oficina mecânica.
              </h2>

              <p className="font-body-lg text-body-lg text-surface-variant">
                Junte-se a milhares de centros automotivos de alta performance usando o GoMech para agendamentos,
                ordens de serviço, estoque e controle financeiro.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px w-12 bg-primary"></div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed/50"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 3: Plan Selection (Full Width Canvas matching onboarding_sele_o_de_plano) */
        <div className="w-full min-h-screen flex flex-col bg-background animate-in fade-in duration-200">
          {/* Top Navbar */}
          <nav className="w-full flex items-center justify-between px-6 sm:px-10 h-16 border-b border-outline-variant bg-surface sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-white">
                  precision_manufacturing
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-primary">GoMech</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider hidden sm:block">
                Etapa 3 de 3: Seleção de Plano
              </span>
              <div className="h-2 w-28 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full rounded-full"></div>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
            <div className="text-center mx-auto mb-10">
              <h1 className="font-display-lg text-3xl sm:text-4xl font-bold text-on-surface mb-2">
                Escolha o plano ideal para sua oficina
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Potencialize a gestão da sua oficina com ferramentas precisas e suporte avançado. Cancele ou altere
                quando quiser.
              </p>
            </div>

            {/* Global Error Banner */}
            {globalError && (
              <div className="max-w-4xl w-full mb-8 bg-error-container/60 border border-error/40 text-on-error-container px-4 py-3 rounded-xl flex items-center gap-3 text-body-sm animate-in fade-in">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0">error</span>
                <span>{globalError}</span>
              </div>
            )}

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full items-start">
              {/* Starter Plan */}
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col h-full hover:bg-surface-container-low transition-all duration-200 shadow-xs">
                <div className="mb-6">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Starter</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                    Para oficinas em crescimento que buscam organização básica.
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg text-3xl font-bold text-on-surface">R$ 99</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">/mês</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1 text-body-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Até 3 mecânicos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Controle de Ordens de Serviço (OS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Gestão de clientes básica</span>
                  </li>
                  <li className="flex items-start gap-2 opacity-50">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
                    <span className="line-through">Controle financeiro avançado</span>
                  </li>
                  <li className="flex items-start gap-2 opacity-50">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
                    <span className="line-through">Suporte com IA</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanSelectionAndSubmit('STARTER')}
                  disabled={registerMutation.isPending}
                  className="w-full py-3 px-4 border border-outline text-on-surface font-label-md text-label-md font-bold rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending && selectedPlan === 'STARTER' ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : null}
                  Selecionar Starter
                </button>
              </div>

              {/* Pro Plan (Highlighted) */}
              <div className="bg-surface border-2 border-primary rounded-2xl p-6 flex flex-col h-full relative shadow-lg transform md:-translate-y-3">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-on-primary font-label-sm text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                  Mais Popular
                </div>

                <div className="mb-6 pt-2">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Pro</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                    O pacote completo para gestão avançada e alta performance.
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg text-3xl font-bold text-primary">R$ 199</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">/mês</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1 text-body-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Mecânicos ilimitados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Controle de Ordens de Serviço (OS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Gestão de clientes completa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span className="font-semibold text-on-surface">Controle financeiro avançado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span className="font-semibold text-on-surface">Suporte a diagnósticos com IA</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanSelectionAndSubmit('PRO')}
                  disabled={registerMutation.isPending}
                  className="w-full py-3.5 px-4 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-xl hover:bg-primary-container active:translate-y-px transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending && selectedPlan === 'PRO' ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : null}
                  Começar com Pro
                </button>
              </div>

              {/* Elite Plan */}
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col h-full hover:bg-surface-container-low transition-all duration-200 shadow-xs">
                <div className="mb-6">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">Elite</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                    Soluções customizadas para redes de oficinas e franquias.
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-2xl font-bold text-on-surface">Customizado</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1 text-body-sm">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Tudo do plano Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Gestão Multi-Lojas / Multi-Unidades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>API para integrações externas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    <span>Gerente de conta dedicado</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanSelectionAndSubmit('ELITE')}
                  disabled={registerMutation.isPending}
                  className="w-full py-3 px-4 border border-outline text-on-surface font-label-md text-label-md font-bold rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending && selectedPlan === 'ELITE' ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : null}
                  Falar com Consultor
                </button>
              </div>
            </div>

            {/* Back button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-label-md text-label-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Voltar para Dados da Oficina
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
