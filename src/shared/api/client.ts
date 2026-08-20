export { api, apiClient, default } from './apiClient';

// Legacy helper kept as no-op since interceptors are mounted directly in apiClient
export const registerApiInterceptors = () => {};
