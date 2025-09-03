"use client";

import { ProgressProvider } from '@bprogress/next/app';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider
      height="4px"
      color="#2563eb" // El color que prefieras
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
}