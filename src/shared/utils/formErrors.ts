import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  invalidParams?: InvalidParam[];
  message?: string;
}

/**
 * Handles RFC 7807 Problem Detail validation errors and attaches them
 * to the corresponding react-hook-form fields.
 *
 * @returns true if validation errors were handled, false otherwise.
 */
export function handleApiValidationErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): boolean {
  const axiosError = error as { response?: { status?: number; data?: ProblemDetail } };
  const data = axiosError?.response?.data;
  const status = axiosError?.response?.status;

  if ((status === 422 || status === 400) && Array.isArray(data?.invalidParams) && data.invalidParams.length > 0) {
    data.invalidParams.forEach((param) => {
      if (param.name && param.reason) {
        setError(param.name as Path<T>, {
          type: 'server',
          message: param.reason,
        });
      }
    });
    return true;
  }

  return false;
}

/**
 * Extracts a readable error message from an API response (RFC 7807 detail/title or fallback).
 */
export function getApiErrorMessage(error: unknown, fallbackMessage = 'Ocorreu um erro ao processar sua solicitação.'): string {
  const axiosError = error as { response?: { data?: ProblemDetail } };
  const data = axiosError?.response?.data;
  return data?.detail || data?.title || data?.message || fallbackMessage;
}
