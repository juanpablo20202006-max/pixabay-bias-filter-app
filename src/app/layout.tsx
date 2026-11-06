import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Buscador Pixabay con Filtro Antisesgo Algorítmico & MongoDB',
  description: 'Taller Práctico: Desarrollo de Aplicación Web con Consumo de API y Filtrado de Sesgos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
