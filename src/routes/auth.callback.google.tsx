import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { authApi } from '@/features/iam/api/auth';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

const googleCallbackSearchSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute('/auth/callback/google')({
  validateSearch: (search) => googleCallbackSearchSchema.parse(search),
  component: GoogleAuthCallback,
});

function GoogleAuthCallback() {
  const { code, state, error: oauthError } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (oauthError) {
      setError(`Erro na autenticação com o Google: ${oauthError}`);
      return;
    }

    if (!code || !state) {
      setError('Parâmetros de autenticação inválidos ou ausentes.');
      return;
    }

    let isMounted = true;

    async function handleCallback() {
      try {
        const response = await authApi.googleCallback({
          code: code!,
          state: state!,
          redirectUri: 'http://localhost:5173/auth/callback/google',
        });

        if (isMounted) {
          setAuth(response.accessToken, response.refreshToken, response.user);
          navigate({ to: '/dashboard' });
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(getApiErrorMessage(err, 'Falha ao autenticar com o Google. Tente novamente.'));
        }
      }
    }

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [code, state, oauthError, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center shadow-lg">
        {error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">Falha na Autenticação</h2>
            <p className="text-sm text-on-surface-variant">{error}</p>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <h2 className="text-xl font-bold text-on-surface">Processando Login</h2>
            <p className="text-sm text-on-surface-variant">Conectando sua conta Google ao GoMech...</p>
          </div>
        )}
      </div>
    </div>
  );
}
