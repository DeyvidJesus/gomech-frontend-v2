import React from 'react';
import { LoadingState, type LoadingStateProps } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState, type EmptyStateProps } from './EmptyState';

export interface QueryStateWrapperProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loadingProps?: LoadingStateProps;
  emptyProps?: EmptyStateProps;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const QueryStateWrapper: React.FC<QueryStateWrapperProps> = ({
  isLoading,
  isError,
  error,
  isEmpty = false,
  loadingProps,
  emptyProps,
  onRetry,
  children,
}) => {
  if (isLoading) {
    return <LoadingState {...loadingProps} />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isEmpty && emptyProps) {
    return <EmptyState {...emptyProps} />;
  }

  return <>{children}</>;
};
