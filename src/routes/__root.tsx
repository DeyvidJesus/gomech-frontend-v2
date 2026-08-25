import { createRootRoute, Outlet } from '@tanstack/react-router';
import React from 'react';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
  component: () => (
    <React.Fragment>
      <Toaster position="top-right" richColors closeButton />
      <Outlet />
    </React.Fragment>
  ),
});

