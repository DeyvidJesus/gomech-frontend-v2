import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';
import { cnpjService } from '@/shared/services/cnpjService';
import { toast } from '@/shared/utils/toast';

const registerSchema = z.object({
  // Step 1: Owner & Account
  ownerName: z.string().min(2, 'Nome completo deve ter no mínimo 2 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Você deve concordar com os Termos de Serviço',
  }),

  // Step 2: Workshop Profile & Receita Federal
  cnpj: z.string().min(14, 'CNPJ é obrigatório (14 dígitos)').refine((val) => val.replace(/\D/g, '').length === 14, {
    message: 'CNPJ deve conter 14 dígitos válidos',
  }),
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
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Mecânica Geral',
    'Diagnóstico Computadorizado',
    'Revisão Preventiva',
  ]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [showCustomServiceInput, setShowCustomServiceInput] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [cepSearch, setCepSearch] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      terms: false,
      cnpj: '',
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
      toast.success('Conta criada com sucesso! 14 dias de teste gratuito liberados.');
      navigate({ to: '/dashboard' });
    },
    onError: (error: unknown) => {
      const handled = handleApiValidationErrors(error, setError);
      if (!handled) {
        const msg = getApiErrorMessage(error, 'Erro ao criar conta da oficina. Verifique os dados e tente novamente.');
        setGlobalError(msg);
        toast.error(msg);
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
    const isValid = await trigger(['cnpj', 'workshopName', 'address', 'bays']);
    if (isValid) {
      setStep(3);
    }
  };

  // CNPJ Receita Federal Auto-Complete
  const handleCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const clean = rawVal.replace(/\D/g, '');
    setValue('cnpj', rawVal, { shouldValidate: true });

    if (clean.length === 14) {
      setSearchingCnpj(true);
      const data = await cnpjService.fetchByCnpj(clean);
      setSearchingCnpj(false);

      if (data) {
        if (data.nomeFantasia || data.razaoSocial) {
          setValue('workshopName', data.nomeFantasia || data.razaoSocial, { shouldValidate: true });
        }
        if (data.email && !getValues('email')) {
          setValue('email', data.email, { shouldValidate: true });
        }
        if (data.telefone && !getValues('phone')) {
          setValue('phone', data.telefone, { shouldValidate: true });
        }
        if (data.logradouro) {
          const fullAddress = `${data.logradouro}, ${data.numero || 'S/N'} - ${data.bairro} - ${data.municipio}/${data.uf} - CEP: ${data.cep}`;
          setValue('address', fullAddress, { shouldValidate: true });
        }
        toast.success(`Dados da Receita Federal carregados: ${data.razaoSocial}`);
      } else {
        toast.info('CNPJ preenchido. Complete os dados da sua oficina.');
      }
    }
  };

  // CEP Auto-Complete
  const handleLookupCep = async () => {
    const clean = cepSearch.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setSearchingCep(true);
    const data = await cnpjService.fetchByCep(clean);
    setSearchingCep(false);

    if (data) {
      const fullAddress = `${data.logradouro}, Bairro ${data.bairro} - ${data.municipio}/${data.uf} - CEP: ${data.cep}`;
      setValue('address', fullAddress, { shouldValidate: true });
      toast.success('Endereço localizado via CEP!');
    } else {
      toast.error('CEP não encontrado.');
    }
  };

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter((s) => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleAddCustomService = () => {
    if (customServiceInput.trim()) {
      const trimmed = customServiceInput.trim();
      if (!selectedServices.includes(trimmed)) {
        setSelectedServices([...selectedServices, trimmed]);
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

  const onSubmit = (data: RegisterFormValues) => {
    setGlobalError(null);

    registerMutation.mutate({
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      cnpj: data.cnpj.replace(/\D/g, ''),
      workshopName: data.workshopName,
      address: data.address,
      bays: data.bays,
      services: selectedServices.length > 0 ? selectedServices : ['Mecânica Geral'],
      planCode: selectedPlan,
    });
  };

  return (
    <div className="flex w-full min-h-screen bg-surface-container-lowest font-body-md text-on-surface antialiased">
      {/* Steps 1 & 2: Split Screen Layout with Cinematic Hero Image */}
      {step !== 3 ? (
        <div className="flex w-full min-h-screen">
          {/* Left Column: Form Canvas */}
          <div className="w-full lg:w-[520px] xl:w-[600px] shrink-0 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 relative z-10 bg-surface-container-lowest overflow-y-auto">
            <div className="w-full max-w-[480px] mx-auto lg:mx-0">
              {/* Step Progress Header */}
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
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">
                      precision_manufacturing
                    </span>
                  </div>
                  <span className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                    GoMech
                  </span>
                </div>

                {step === 1 ? (
                  <>
                    <h1 className="font-display-lg text-[28px] sm:text-[32px] font-bold text-on-surface mb-1 tracking-tight leading-tight">
                      Criar Conta GoMech
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Configure seu espaço de trabalho profissional para sua oficina.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="font-display-lg text-[28px] sm:text-[32px] font-bold text-on-surface mb-1 tracking-tight leading-tight">
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
                <div className="mb-6 p-4 rounded-2xl bg-error-container/40 border border-error/20 flex items-start gap-3 animate-shake">
                  <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                  <p className="text-xs text-error font-medium leading-relaxed">{globalError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* STEP 1: ADMIN USER */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Nome Completo do Responsável <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('ownerName')}
                        placeholder="Ex: Carlos Eduardo Silva"
                        className={`w-full h-11 px-4 bg-surface border rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                          errors.ownerName
                            ? 'border-error focus:border-error focus:ring-error'
                            : 'border-outline-variant focus:border-primary focus:ring-primary'
                        }`}
                      />
                      {errors.ownerName && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.ownerName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        E-mail Corporativo / Acesso <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        placeholder="carlos@oficina.com.br"
                        className={`w-full h-11 px-4 bg-surface border rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                          errors.email
                            ? 'border-error focus:border-error focus:ring-error'
                            : 'border-outline-variant focus:border-primary focus:ring-primary'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Telefone Celular / WhatsApp
                      </label>
                      <input
                        type="tel"
                        {...register('phone')}
                        placeholder="(11) 98765-4321"
                        className="w-full h-11 px-4 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Senha de Acesso <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          placeholder="Mínimo 6 caracteres"
                          className={`w-full h-11 pl-4 pr-11 bg-surface border rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                            errors.password
                              ? 'border-error focus:border-error focus:ring-error'
                              : 'border-outline-variant focus:border-primary focus:ring-primary'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register('terms')}
                          className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-on-surface-variant leading-tight">
                          Concordo com os{' '}
                          <a href="#" className="text-primary font-semibold hover:underline">
                            Termos de Uso
                          </a>{' '}
                          e a{' '}
                          <a href="#" className="text-primary font-semibold hover:underline">
                            Política de Privacidade
                          </a>
                          .
                        </span>
                      </label>
                      {errors.terms && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.terms.message}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToStep2}
                      className="w-full h-12 mt-4 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                      <span>Continuar: Dados da Oficina</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                )}

                {/* STEP 2: WORKSHOP PROFILE & RECEITA FEDERAL */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* Logo Upload Box */}
                    <label className="group border border-dashed border-outline-variant rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-surface-container-low hover:border-primary transition-colors bg-surface">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-on-surface font-semibold">
                          {logoPreview ? 'Logomarca Carregada' : 'Logomarca da Oficina'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          PNG ou JPG até 2MB (opcional).
                        </p>
                      </div>
                    </label>

                    {/* CNPJ with Receita Federal Auto-Lookup */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-on-surface">
                          CNPJ da Oficina <span className="text-error">*</span>
                        </label>
                        <span className="text-[11px] text-tertiary flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          Busca na Receita Federal
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={18}
                          {...register('cnpj')}
                          onChange={handleCnpjChange}
                          placeholder="00.000.000/0000-00"
                          className={`w-full h-11 px-4 bg-surface border rounded-xl text-sm font-mono text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                            errors.cnpj
                              ? 'border-error focus:border-error focus:ring-error'
                              : 'border-outline-variant focus:border-primary focus:ring-primary'
                          }`}
                        />
                        {searchingCnpj && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-primary animate-spin">
                            progress_activity
                          </span>
                        )}
                      </div>
                      {errors.cnpj && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.cnpj.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Razão Social / Nome da Oficina <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('workshopName')}
                        placeholder="Ex: Auto Mecânica Estrela Ltda"
                        className={`w-full h-11 px-4 bg-surface border rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                          errors.workshopName
                            ? 'border-error focus:border-error focus:ring-error'
                            : 'border-outline-variant focus:border-primary focus:ring-primary'
                        }`}
                      />
                      {errors.workshopName && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.workshopName.message}</p>
                      )}
                    </div>

                    {/* CEP Helper */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Busca de Endereço por CEP
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={9}
                          value={cepSearch}
                          onChange={(e) => setCepSearch(e.target.value)}
                          placeholder="00000-000"
                          className="w-36 h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm font-mono text-on-surface"
                        />
                        <button
                          type="button"
                          onClick={handleLookupCep}
                          disabled={searchingCep}
                          className="h-10 px-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {searchingCep ? (
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">search</span>
                          )}
                          Buscar CEP
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Endereço Completo da Matriz <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('address')}
                        placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                        className={`w-full h-11 px-4 bg-surface border rounded-xl text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 transition-all ${
                          errors.address
                            ? 'border-error focus:border-error focus:ring-error'
                            : 'border-outline-variant focus:border-primary focus:ring-primary'
                        }`}
                      />
                      {errors.address && (
                        <p className="text-[11px] text-error font-medium mt-1">{errors.address.message}</p>
                      )}
                    </div>

                    {/* Number of Service Bays */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Quantidade de Boxes de Atendimento <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        {...register('bays', { valueAsNumber: true })}
                        className="w-32 h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Full List of Services + Custom Adder */}
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1.5">
                        Serviços e Especialidades da Oficina
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DEFAULT_SERVICES.map((srv) => {
                          const isSelected = selectedServices.includes(srv);
                          return (
                            <button
                              key={srv}
                              type="button"
                              onClick={() => toggleService(srv)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-primary text-on-primary font-bold shadow-xs'
                                  : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container'
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
                              className="px-3 py-1.5 rounded-full text-xs bg-primary text-on-primary font-bold shadow-xs flex items-center gap-1"
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
                            className="px-3 py-1.5 rounded-full text-xs border border-dashed border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
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
                              className="h-8 px-2 border border-primary rounded-lg text-xs bg-surface text-on-surface outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomService}
                              className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold"
                            >
                              Adicionar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 h-12 border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToStep3}
                        className="w-2/3 h-12 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <span>Escolher Plano</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="mt-8 text-center border-t border-outline-variant pt-4">
                <p className="text-xs text-on-surface-variant">
                  Já possui uma conta na GoMech?{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    Fazer login
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Cinematic Brand Illustration */}
          <div className="hidden lg:flex flex-1 relative bg-inverse-surface items-center justify-center overflow-hidden border-l border-outline-variant">
            <img
              alt="Oficina Mecânica Moderna"
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

              <p className="font-body-lg text-body-lg text-surface-variant max-w-[500px]">
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
        /* STEP 3: Plan Selection (Full Canvas) */
        <div className="w-full min-h-screen flex flex-col bg-background animate-in fade-in duration-200">
          {/* Top Navbar */}
          <nav className="w-full flex items-center justify-between px-6 sm:px-10 h-16 border-b border-outline-variant bg-surface sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  precision_manufacturing
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm font-bold text-primary">GoMech</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
              <span>Etapa 3 de 3: Seleção de Plano</span>
            </div>
          </nav>

          <main className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-12 flex flex-col justify-center">
            <div className="text-center max-w-[640px] mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary text-xs font-bold mb-3 border border-tertiary/20">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                14 Dias de Teste Gratuito
              </div>
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline-lg">
                Escolha o plano ideal para sua oficina
              </h2>
              <p className="text-sm text-on-surface-variant mt-2">
                Experimente todos os recursos gratuitamente por 14 dias. Sem cobrança antecipada.
              </p>
            </div>

            {/* Global Error Banner */}
            {globalError && (
              <div className="mb-6 max-w-[600px] mx-auto p-4 rounded-2xl bg-error-container/40 border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">error</span>
                <p className="text-xs text-error font-medium">{globalError}</p>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  code: 'STARTER',
                  name: 'Starter',
                  price: 'R$ 99',
                  desc: 'Ideal para oficinas independentes e mecânicos autônomos.',
                  features: [
                    'Até 50 OS / mês',
                    'Até 3 Mecânicos',
                    'Gestão de Peças e Estoque',
                    'Controle de Ferramentaria',
                  ],
                },
                {
                  code: 'PRO',
                  name: 'Professional',
                  price: 'R$ 199',
                  desc: 'Para oficinas em crescimento que buscam gestão completa e automação.',
                  badge: 'Mais Escolhido',
                  popular: true,
                  features: [
                    'Até 250 OS / mês',
                    'Até 10 Mecânicos',
                    'Módulo Financeiro & DRE',
                    'IA GoMech para Diagnósticos',
                    'Disparo de WhatsApp e E-mails',
                  ],
                },
                {
                  code: 'ENTERPRISE',
                  name: 'Enterprise',
                  price: 'R$ 399',
                  desc: 'Para grandes centros automotivos e redes de oficinas.',
                  features: [
                    'Ordens de Serviço Ilimitadas',
                    'Mecânicos e Filiais Ilimitadas',
                    'Módulo Financeiro + Conciliação',
                    'IA Ilimitada e Suporte Dedicado',
                  ],
                },
              ].map((p) => {
                const active = selectedPlan === p.code;
                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code as any)}
                    className={`p-7 rounded-3xl border cursor-pointer relative flex flex-col justify-between transition-all duration-200 ${
                      active
                        ? 'border-primary bg-surface-container-lowest ring-2 ring-primary/40 shadow-xl scale-[1.02]'
                        : p.popular
                        ? 'border-primary/60 bg-surface-container-lowest hover:border-primary shadow-md'
                        : 'border-outline-variant bg-surface-container-lowest hover:border-outline shadow-sm'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider shadow-sm">
                        {p.badge}
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-on-surface">{p.name}</h3>
                      <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{p.desc}</p>

                      <div className="my-6 pb-6 border-b border-outline-variant/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold font-mono text-on-surface">
                            {p.price}
                          </span>
                          <span className="text-xs text-on-surface-variant">/ mês</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {p.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-on-surface">
                            <span className="material-symbols-outlined text-primary text-[16px]">
                              check_circle
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(p.code as any);
                        handleSubmit(onSubmit)();
                      }}
                      disabled={isSubmitting || registerMutation.isPending}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                        active
                          ? 'bg-primary text-on-primary hover:bg-primary-container shadow-primary/20'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant'
                      }`}
                    >
                      {isSubmitting || registerMutation.isPending ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>Criando conta da oficina...</span>
                        </>
                      ) : (
                        <>
                          <span>Começar com {p.name} (14 Dias Grátis)</span>
                          <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Back Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Voltar para Dados da Oficina
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
