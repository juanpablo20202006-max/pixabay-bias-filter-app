import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANTIGRAVITY // Pixabay API + MongoDB NoSQL + Filtro Antisesgo',
  description: 'Taller Práctico: Consumo de API Pixabay, Persistencia NoSQL MongoDB y Mitigación de Sesgos Algorítmicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
