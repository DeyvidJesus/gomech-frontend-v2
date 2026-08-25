import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toolsApi } from '../api/toolsApi';
import { iamApi, type UserResponse } from '@/features/iam/api/iam';
import type { Tool } from '../types';

interface ToolCustodyModalProps {
  tool: Tool;
  onClose: () => void;
  onSuccess: () => void;
}

export function ToolCustodyModal({ tool, onClose, onSuccess }: ToolCustodyModalProps) {
  const isAvailable = tool.status === 'AVAILABLE';

  // Form State
  const [mechanicUserId, setMechanicUserId] = useState('');
  const [locationInUnit, setLocationInUnit] = useState(tool.locationInUnit || '');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch users for mechanic assignment
  const { data: usersResponse } = useQuery({
    queryKey: ['iam', 'users', 'picker'],
    queryFn: () => iamApi.users().then((r) => r.data),
  });

  const users: UserResponse[] = usersResponse || [];

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: () =>
      toolsApi.checkOut({
        toolId: tool.id,
        mechanicUserId,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => onSuccess(),
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Erro ao realizar check-out da ferramenta.');
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () =>
      toolsApi.checkIn({
        toolId: tool.id,
        locationInUnit: locationInUnit.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => onSuccess(),
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Erro ao realizar devolução da ferramenta.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isAvailable) {
      if (!mechanicUserId) {
        setErrorMsg('Selecione o mecânico/técnico responsável pelo check-out.');
        return;
      }
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
  };

  const isPending = checkOutMutation.isPending || checkInMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface-container-lowest w-full max-w-[480px] rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">how_to_reg</span>
            <h3 className="text-base font-bold text-on-surface">
              {isAvailable ? 'Check-out de Ferramenta' : 'Devolução / Check-in'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tool Summary Card */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface">
                {tool.assetTag}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {tool.brand ? `${tool.brand} • ` : ''}{tool.categoryName || 'Geral'}
              </span>
            </div>
            <div className="font-semibold text-sm text-on-surface mt-1">{tool.name}</div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container/40 text-error text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {isAvailable ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                Mecânico / Técnico Responsável *
              </label>
              <select
                required
                value={mechanicUserId}
                onChange={(e) => setMechanicUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione o profissional...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
                Localização de Devolução (Armário / Gaveta)
              </label>
              <input
                type="text"
                placeholder="Ex: Armário 2 - Gaveta 03"
                value={locationInUnit}
                onChange={(e) => setLocationInUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">
              Observações / Justificativa
            </label>
            <textarea
              rows={2}
              placeholder={isAvailable ? "Ex: Retirado para serviço no elevador 1..." : "Ex: Equipamento limpo e verificado..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              )}
              {isAvailable ? 'Confirmar Retirada' : 'Confirmar Devolução'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
