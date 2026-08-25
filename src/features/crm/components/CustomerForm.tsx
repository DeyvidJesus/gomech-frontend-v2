import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import {
  isValidDocument,
  maskDocument,
  maskPhone,
  maskCep,
  isValidLicensePlate,
  maskLicensePlate,
  formatLicensePlate,
} from '../utils/validators';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';

const customerFormSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255, 'Nome muito longo'),
    document: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().min(8, 'Telefone deve ter no mínimo 8 dígitos').max(50, 'Telefone muito longo'),
    zip: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    licensePlate: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.union([z.number(), z.string(), z.nan()]).optional(),
    vin: z.string().optional(),
    currentMileage: z.union([z.number(), z.string(), z.nan()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.document && data.document.trim() !== '') {
      if (!isValidDocument(data.document)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CPF ou CNPJ inválido (verifique os dígitos verificadores)',
          path: ['document'],
        });
      }
    }
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-mail inválido',
          path: ['email'],
        });
      }
    }
    if (data.licensePlate && data.licensePlate.trim() !== '') {
      if (!isValidLicensePlate(data.licensePlate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Placa inválida. Formatos válidos: ABC-1234 (Tradicional) ou ABC1D23 (Mercosul)',
          path: ['licensePlate'],
        });
      }
    }
  });

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {

  customerId?: string;
}

export function CustomerForm({ customerId }: CustomerFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(customerId);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showVehicleSection, setShowVehicleSection] = useState(false);

  // Fetch existing customer if in Edit mode
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['crm', 'customer', customerId],
    queryFn: () => crmApi.getCustomerById(customerId!),
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      document: '',
      email: '',
      phone: '',
      zip: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      licensePlate: '',
      brand: '',
      model: '',
      year: undefined,
      vin: '',
      currentMileage: undefined,
    },
  });

  // Populate form when existing customer loads
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || '',
        document: customer.formattedDocument || customer.document || '',
        email: customer.email || '',
        phone: customer.phone || '',
        street: customer.address || '',
        zip: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        licensePlate: '',
        brand: '',
        model: '',
        vin: '',
      });
    }
  }, [customer, reset]);


  // Create Customer Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Construct full address string
      const addressParts = [
        data.street,
        data.number ? `nº ${data.number}` : null,
        data.neighborhood,
        data.city && data.state ? `${data.city}/${data.state}` : data.city || data.state,
        data.zip ? `CEP: ${data.zip}` : null,
      ].filter(Boolean);

      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

      const createdCustomer = await crmApi.createCustomer({
        name: data.name.trim(),
        document: data.document ? data.document.replace(/\D/g, '') : undefined,
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: fullAddress,
      });

      // If initial vehicle data is provided, create it
      if (data.licensePlate && data.licensePlate.trim()) {
        try {
          await crmApi.createVehicle({
            customerId: createdCustomer.id,
            licensePlate: data.licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
            brand: data.brand?.trim() || undefined,
            model: data.model?.trim() || undefined,
            year: data.year ? Number(data.year) : undefined,
            vin: data.vin?.trim().toUpperCase() || undefined,
            currentMileage: data.currentMileage ? Number(data.currentMileage) : undefined,
          });
        } catch (vehErr) {
          console.error('Failed to create optional initial vehicle:', vehErr);
        }
      }

      return createdCustomer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'vehicles'] });
      navigate({ to: '/crm/customers' });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao cadastrar cliente. Tente novamente.'));
      }
    },
  });

  // Update Customer Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const addressParts = [
        data.street,
        data.number ? `nº ${data.number}` : null,
        data.neighborhood,
        data.city && data.state ? `${data.city}/${data.state}` : data.city || data.state,
        data.zip ? `CEP: ${data.zip}` : null,
      ].filter(Boolean);

      const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : data.street || undefined;

      return crmApi.updateCustomer(customerId!, {
        name: data.name.trim(),
        document: data.document ? data.document.replace(/\D/g, '') : undefined,
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        address: fullAddress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'customer', customerId] });
      navigate({ to: '/crm/customers' });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao atualizar cliente. Tente novamente.'));
      }
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    setServerError(null);
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const documentValue = watch('document');
  const phoneValue = watch('phone');
  const zipValue = watch('zip');
  const plateValue = watch('licensePlate');

  if (isEditMode && isLoadingCustomer) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 text-body-md font-medium">Carregando dados do cliente...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto py-4 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate({ to: '/crm/customers' })}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface hover:bg-surface-container transition-colors border border-outline-variant text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
              {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              {isEditMode
                ? `Atualize os dados cadastrais e de contato de ${customer?.name || 'cliente'}.`
                : 'Cadastre os dados pessoais, endereço e veículo inicial do cliente.'}
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/crm/customers' })}
            className="px-5 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors border border-outline-variant"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 rounded-lg font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container transition-all shadow-sm active:translate-y-px disabled:opacity-50 flex items-center gap-2 font-bold"
          >
            {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            )}
            {isEditMode ? 'Salvar Alterações' : 'Salvar Cliente'}
          </button>
        </div>
      </header>

      {/* Global Server Error Alert */}
      {serverError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl border border-error/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
            error
          </span>
          <div className="text-body-sm font-medium">{serverError}</div>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pb-20">
        {/* Section: Personal Information */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">person</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Dados Pessoais
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="fullName">
                Nome Completo / Razão Social <span className="text-error">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Ex: Carlos Alberto Silva / Silva & Filhos Ltda"
                {...register('name')}
                className={`h-11 px-3.5 rounded-lg border bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary ${
                  errors.name ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.name && (
                <span className="text-[12px] text-error font-medium">{errors.name.message}</span>
              )}
            </div>

            {/* CPF / CNPJ */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="docId">
                CPF / CNPJ
              </label>
              <input
                id="docId"
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={documentValue || ''}
                onChange={(e) => setValue('document', maskDocument(e.target.value), { shouldValidate: true })}
                className={`h-11 px-3.5 rounded-lg border bg-surface text-on-surface font-body-md text-body-md font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary ${
                  errors.document ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.document && (
                <span className="text-[12px] text-error font-medium">{errors.document.message}</span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="cliente@exemplo.com.br"
                {...register('email')}
                className={`h-11 px-3.5 rounded-lg border bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary ${
                  errors.email ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.email && (
                <span className="text-[12px] text-error font-medium">{errors.email.message}</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="phone">
                Telefone / WhatsApp <span className="text-error">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={phoneValue || ''}
                onChange={(e) => setValue('phone', maskPhone(e.target.value), { shouldValidate: true })}
                className={`h-11 px-3.5 rounded-lg border bg-surface text-on-surface font-body-md text-body-md font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary ${
                  errors.phone ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                }`}
              />
              {errors.phone && (
                <span className="text-[12px] text-error font-medium">{errors.phone.message}</span>
              )}
            </div>
          </div>
        </section>

        {/* Section: Address */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Endereço & Localização
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-4">
            {/* ZIP / CEP */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="zip">
                CEP
              </label>
              <input
                id="zip"
                type="text"
                placeholder="00000-000"
                value={zipValue || ''}
                onChange={(e) => setValue('zip', maskCep(e.target.value))}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Street */}
            <div className="flex flex-col gap-1.5 md:col-span-4">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="street">
                Logradouro / Rua
              </label>
              <input
                id="street"
                type="text"
                placeholder="Av. Paulista, Rua das Flores..."
                {...register('street')}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Number */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="number">
                Número
              </label>
              <input
                id="number"
                type="text"
                placeholder="123 / S/N"
                {...register('number')}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Neighborhood */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="neighborhood">
                Bairro
              </label>
              <input
                id="neighborhood"
                type="text"
                placeholder="Bela Vista"
                {...register('neighborhood')}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5 md:col-span-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="city">
                Cidade
              </label>
              <input
                id="city"
                type="text"
                placeholder="São Paulo"
                {...register('city')}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* State */}
            <div className="flex flex-col gap-1.5 md:col-span-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="state">
                UF
              </label>
              <input
                id="state"
                type="text"
                placeholder="SP"
                maxLength={2}
                {...register('state')}
                className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md uppercase outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        {/* Section: Linked Vehicles (Edit Mode) */}
        {isEditMode && customer && (
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">directions_car</span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Veículos Cadastrados ({customer.vehicles?.length || 0})
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: '/crm/vehicles/new',
                    search: { customerId: customer.id } as never,
                  })
                }
                className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Novo Veículo
              </button>
            </div>

            {(!customer.vehicles || customer.vehicles.length === 0) ? (
              <div className="py-8 text-center text-on-surface-variant">
                <p className="text-body-sm">Nenhum veículo cadastrado para este cliente ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customer.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-lg border border-outline-variant bg-surface flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-primary font-mono font-bold text-xs">
                          {v.formattedLicensePlate || formatLicensePlate(v.licensePlate)}
                        </span>
                        <span className="font-semibold text-on-surface text-body-md">
                          {v.brand} {v.model}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant mt-1">
                        Ano: {v.year || '—'} • Km: {v.currentMileage ? `${v.currentMileage.toLocaleString()} km` : '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: '/crm/vehicles/$id',
                          params: { id: v.id },
                        })
                      }
                      className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                      title="Editar Veículo"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Section: Optional Initial Vehicle (Create Mode) */}
        {!isEditMode && (
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">directions_car</span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Primeiro Veículo <span className="text-on-surface-variant font-body-sm text-body-sm font-normal">(Opcional)</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleSection(!showVehicleSection)}
                className="text-label-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showVehicleSection ? 'remove' : 'add'}
                </span>
                {showVehicleSection ? 'Ocultar Veículo' : 'Adicionar Veículo Agora'}
              </button>
            </div>

            {showVehicleSection && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 animate-in fade-in duration-150">
                {/* Plate */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="plate">
                    Placa (Mercosul ou Tradicional)
                  </label>
                  <input
                    id="plate"
                    type="text"
                    placeholder="ABC-1234 ou ABC1D23"
                    value={plateValue || ''}
                    onChange={(e) => setValue('licensePlate', maskLicensePlate(e.target.value), { shouldValidate: true })}
                    className={`h-11 px-3.5 rounded-lg border bg-surface text-on-surface font-body-md text-body-md uppercase font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary ${
                      errors.licensePlate ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                    }`}
                  />
                  {errors.licensePlate && (
                    <span className="text-[12px] text-error font-medium">{errors.licensePlate.message}</span>
                  )}
                </div>

                {/* Make / Brand */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="brand">
                    Marca / Fabricante
                  </label>
                  <input
                    id="brand"
                    type="text"
                    placeholder="Ex: Toyota, Honda, Ford"
                    {...register('brand')}
                    className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="model">
                    Modelo
                  </label>
                  <input
                    id="model"
                    type="text"
                    placeholder="Ex: Corolla XEi 2.0"
                    {...register('model')}
                    className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Year */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="year">
                    Ano / Modelo
                  </label>
                  <input
                    id="year"
                    type="number"
                    placeholder="2023"
                    {...register('year', { valueAsNumber: true })}
                    className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* VIN / Chassi */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="vin">
                    Chassi / VIN
                  </label>
                  <input
                    id="vin"
                    type="text"
                    maxLength={17}
                    placeholder="17 caracteres do chassi"
                    {...register('vin')}
                    className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md uppercase font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Mileage */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="km">
                    Quilometragem Atual (KM)
                  </label>
                  <input
                    id="km"
                    type="number"
                    placeholder="45000"
                    {...register('currentMileage', { valueAsNumber: true })}
                    className="h-11 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface font-body-md text-body-md font-mono outline-none transition-all placeholder:text-outline/70 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Mobile Sticky Footer */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant p-4 flex gap-3 z-30 shadow-lg">
          <button
            type="button"
            onClick={() => navigate({ to: '/crm/customers' })}
            className="flex-1 py-2.5 rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant bg-surface"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="flex-1 py-2.5 rounded-lg font-label-md text-label-md bg-primary text-on-primary font-semibold"
          >
            {isEditMode ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
