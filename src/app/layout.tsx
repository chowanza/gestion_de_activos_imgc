import { ThemeProvider } from "../components/theme-provider";
import { ReactNode } from "react";
import './globals.css';
import { Providers } from "../app/(app)/providers";

type RootLayoutProps = {
  children: ReactNode;
};


export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="es" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
            {children}
            </Providers>
            {/* El RootLayout ahora solo renderiza sus hijos directamente */}

          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
