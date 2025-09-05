import { ReactNode } from "react";
import './globals.css';
import { Providers } from "../app/(app)/providers";

type RootLayoutProps = {
  children: ReactNode;
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
