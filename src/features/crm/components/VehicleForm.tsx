import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { crmApi } from '../api/crmApi';
import {
  isValidLicensePlate,
  maskLicensePlate,
} from '../utils/validators';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';

const vehicleFormSchema = z.object({
  customerId: z.string().min(1, 'Selecione o cliente proprietário'),
  licensePlate: z
    .string()
    .min(1, 'A placa é obrigatória')
    .refine(
      (val) => isValidLicensePlate(val),
      'Placa inválida. Formato: ABC-1234 (Tradicional) ou ABC1D23 (Mercosul)'
    ),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.union([z.number(), z.string(), z.nan()]).optional(),
  vin: z.string().max(17, 'Chassi (VIN) deve ter no máximo 17 caracteres').optional(),
  currentMileage: z.union([z.number(), z.string(), z.nan()]).optional(),
  color: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicleId?: string;
  preselectedCustomerId?: string;
}

const COMMON_BRANDS = [
  'Chevrolet',
  'Volkswagen',
  'Fiat',
  'Toyota',
  'Hyundai',
  'Renault',
  'Ford',
  'Honda',
  'Nissan',
  'Jeep',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Peugeot',
  'Citroën',
  'Mitsubishi',
  'Volvo',
  'Kia',
  'Chery',
  'BYD',
  'GWM',
];

export function VehicleForm({ vehicleId, preselectedCustomerId }: VehicleFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(vehicleId);

  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch vehicle if in edit mode
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['crm', 'vehicle', vehicleId],
    queryFn: () => crmApi.getVehicleById(vehicleId!),
    enabled: isEditMode,
  });

  // Search customers for dropdown
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['crm', 'customers', 'search', customerSearch],
    queryFn: () => crmApi.getCustomers({ q: customerSearch || undefined, size: 10 }),
    enabled: customerDropdownOpen || Boolean(preselectedCustomerId),
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      licensePlate: '',
      brand: '',
      model: '',
      year: undefined,
      vin: '',
      currentMileage: undefined,
      color: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const plateValue = watch('licensePlate');

  // Find selected customer name
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');

  // Auto-set preselected customer name when loaded
  useEffect(() => {
    if (preselectedCustomerId && customersData?.content) {
      const found = customersData.content.find((c) => c.id === preselectedCustomerId);
      if (found) {
        setValue('customerId', found.id);
        setSelectedCustomerName(found.name);
      }
    }
  }, [preselectedCustomerId, customersData, setValue]);

  // Populate form if in edit mode
  useEffect(() => {
    if (vehicle) {
      reset({
        customerId: vehicle.customerId,
        licensePlate: vehicle.formattedLicensePlate || vehicle.licensePlate,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || undefined,
        vin: vehicle.vin || '',
        currentMileage: vehicle.currentMileage || undefined,
        color: '',
      });
      setSelectedCustomerName(vehicle.customerName || '');
    }
  }, [vehicle, reset]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return crmApi.createVehicle({
        customerId: data.customerId,
        licensePlate: data.licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        brand: data.brand?.trim() || undefined,
        model: data.model?.trim() || undefined,
        year: data.year ? Number(data.year) : undefined,
        vin: data.vin?.trim().toUpperCase() || undefined,
        currentMileage: data.currentMileage ? Number(data.currentMileage) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'customers'] });
      navigate({ to: '/crm/vehicles' });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao cadastrar veículo. Tente novamente.'));
      }
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return crmApi.updateVehicle(vehicleId!, {
        customerId: data.customerId,
        licensePlate: data.licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        brand: data.brand?.trim() || undefined,
        model: data.model?.trim() || undefined,
        year: data.year ? Number(data.year) : undefined,
        vin: data.vin?.trim().toUpperCase() || undefined,
        currentMileage: data.currentMileage ? Number(data.currentMileage) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'vehicle', vehicleId] });
      navigate({ to: '/crm/vehicles' });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao atualizar veículo. Tente novamente.'));
      }
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    setServerError(null);
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditMode && isLoadingVehicle) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
          progress_activity
        </span>
        <p className="mt-2 text-body-md font-medium">Carregando dados do veículo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto py-4 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/crm/vehicles' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Veículos
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              {isEditMode ? 'Editar Veículo' : 'Cadastrar Veículo'}
            </span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            {isEditMode ? 'Editar Veículo' : 'Cadastrar Veículo'}
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">
            {isEditMode
              ? `Atualize os dados e especificações do veículo de placa ${vehicle?.formattedLicensePlate || vehicle?.licensePlate}.`
              : 'Informe as especificações do veículo, identificação e vincule a um cliente.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/crm/vehicles' })}
            className="px-4 py-2 bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors shadow-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary-container transition-all shadow-sm active:translate-y-[1px] disabled:opacity-50 flex items-center gap-2 font-bold"
          >
            {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            )}
            {isEditMode ? 'Salvar Alterações' : 'Salvar Veículo'}
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

      {/* Main Grid */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Vehicle Details (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card: Identification */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              Identificação
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Plate */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="plate">
                  Placa (Mercosul ou Tradicional) <span className="text-error">*</span>
                </label>
                <input
                  id="plate"
                  type="text"
                  placeholder="ABC-1234 ou ABC1D23"
                  value={plateValue || ''}
                  onChange={(e) =>
                    setValue('licensePlate', maskLicensePlate(e.target.value), { shouldValidate: true })
                  }
                  className={`h-11 px-3.5 bg-surface border rounded-lg text-body-md font-body-md text-on-surface uppercase font-mono placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                    errors.licensePlate ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                  }`}
                />
                {errors.licensePlate && (
                  <span className="text-[12px] text-error font-medium">{errors.licensePlate.message}</span>
                )}
              </div>

              {/* VIN */}
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
                  className="h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface uppercase font-mono text-[13px] placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {errors.vin && (
                  <span className="text-[12px] text-error font-medium">{errors.vin.message}</span>
                )}
              </div>
            </div>
          </section>

          {/* Card: Specifications */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
              Especificações
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Make / Brand */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="brand">
                  Marca / Fabricante
                </label>
                <div className="relative">
                  <input
                    id="brand"
                    type="text"
                    list="brand-options"
                    placeholder="Selecione ou digite a marca"
                    {...register('brand')}
                    className="w-full h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <datalist id="brand-options">
                    {COMMON_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Model */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="model">
                  Modelo
                </label>
                <input
                  id="model"
                  type="text"
                  placeholder="Ex: Corolla XEi 2.0, Civic, Onix"
                  {...register('model')}
                  className="h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                  min={1950}
                  max={2030}
                  {...register('year', { valueAsNumber: true })}
                  className="h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface font-mono placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Exterior Color */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="color">
                  Cor
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    palette
                  </span>
                  <input
                    id="color"
                    type="text"
                    placeholder="Ex: Prata, Preto, Branco"
                    {...register('color')}
                    className="w-full h-11 pl-9 pr-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Current Mileage */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium" htmlFor="km">
                  Quilometragem Atual (KM)
                </label>
                <div className="relative max-w-[320px]">
                  <input
                    id="km"
                    type="number"
                    placeholder="0"
                    {...register('currentMileage', { valueAsNumber: true })}
                    className="w-full h-11 px-3.5 pr-12 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface font-mono text-right placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-label-sm font-label-sm text-on-surface-variant font-semibold">
                    KM
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Deixe em branco se não souber.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Ownership & Context (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Client Linking */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-fixed-dim"></div>
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-2 flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>
              Proprietário <span className="text-error">*</span>
            </h2>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
              Vincule este veículo a um cliente existente ou cadastre um novo.
            </p>

            {/* Selected Client Display or Search */}
            <div className="relative" ref={dropdownRef}>
              <label className="sr-only" htmlFor="client-search">
                Buscar Cliente
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  id="client-search"
                  type="text"
                  placeholder="Buscar cliente por nome, CPF ou telefone..."
                  value={selectedCustomerName || customerSearch}
                  onFocus={() => {
                    setCustomerDropdownOpen(true);
                    if (selectedCustomerName) {
                      setCustomerSearch('');
                    }
                  }}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomerName('');
                    setValue('customerId', '');
                    setCustomerDropdownOpen(true);
                  }}
                  className={`w-full h-11 pl-9 pr-8 bg-surface border rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                    errors.customerId ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                  }`}
                />
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue('customerId', '', { shouldValidate: true });
                      setSelectedCustomerName('');
                      setCustomerSearch('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {errors.customerId && (
                <span className="text-[12px] text-error font-medium mt-1 block">
                  {errors.customerId.message}
                </span>
              )}

              {/* Autocomplete Dropdown */}
              {customerDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <ul className="max-h-52 overflow-y-auto py-1 divide-y divide-outline-variant/30">
                    {isLoadingCustomers ? (
                      <li className="px-4 py-3 text-center text-body-sm text-on-surface-variant">
                        Buscando clientes...
                      </li>
                    ) : !customersData?.content || customersData.content.length === 0 ? (
                      <li className="px-4 py-3 text-center text-body-sm text-on-surface-variant">
                        Nenhum cliente encontrado.
                      </li>
                    ) : (
                      customersData.content.map((c) => (
                        <li
                          key={c.id}
                          onClick={() => {
                            setValue('customerId', c.id, { shouldValidate: true });
                            setSelectedCustomerName(c.name);
                            setCustomerDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-surface-container cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="font-label-md text-label-md font-semibold text-on-surface">
                              {c.name}
                            </div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                              {c.formattedDocument || c.phone || c.email || 'Sem documento'}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-[18px]">
                            add_link
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-outline-variant"></div>
              <span className="text-[10px] font-label-sm text-outline uppercase tracking-widest font-semibold">
                OU
              </span>
              <div className="h-px flex-1 bg-outline-variant"></div>
            </div>

            {/* Create New Client Quick Button */}
            <button
              type="button"
              onClick={() => navigate({ to: '/crm/customers/new' })}
              className="w-full py-2.5 bg-transparent border border-dashed border-outline text-primary font-label-md text-label-md font-semibold rounded-lg hover:bg-surface-container hover:border-primary transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Cadastrar Novo Cliente
            </button>
          </section>

          {/* Validation / Info Card */}
          <section className="bg-surface-container rounded-xl p-4 border border-outline-variant/60">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                info
              </span>
              <div>
                <h3 className="text-label-md font-label-md font-semibold text-on-surface mb-1">
                  Validação de Placas
                </h3>
                <p className="text-body-sm text-body-sm text-on-surface-variant">
                  O sistema aceita placas no padrão <strong>Mercosul (ABC1D23)</strong> e no padrão{' '}
                  <strong>Tradicional (ABC-1234)</strong>. A placa será vinculada exclusivamente ao cliente selecionado.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
