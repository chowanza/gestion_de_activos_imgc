import { ReactNode } from "react";
import './globals.css';
import { Providers } from "../app/(app)/providers";

type RootLayoutProps = {
  children: ReactNode;
};


export const metadata = {
  title: 'IMGC - Gestión de Activos',
  description: 'Sistema de gestión de activos informáticos IMGC',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="es">
        <head />
        <body>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </>
  );
}
