import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from './components/AppShell';
import QueryProvider from '@/lib/react-query/QueryProvider';
import CommandPalette from '@/components/CommandPalette';
import { CommandPaletteProvider } from '@/lib/contexts/CommandPaletteContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Manei-Lift - GMAO Ascenseurs',
  description: 'Maquette GMAO Manei-Lift : pilotage du parc, interventions, maintenances et CTQ pour la gestion d\'un parc d\'ascenseurs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryProvider>
          <CommandPaletteProvider>
            <AppShell>{children}</AppShell>

            {/* Command Palette global */}
            <CommandPalette />
          </CommandPaletteProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
