import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import AppShell from './components/AppShell';
import CommandPalette from '@/components/CommandPalette';
import { CommandPaletteProvider } from '@/lib/contexts/CommandPaletteContext';

// Police servie depuis le dépôt plutôt que téléchargée par `next/font/google`
// au moment du build : le serveur de déploiement n'a pas d'accès sortant vers
// fonts.googleapis.com, et le build y échouait sur « Failed to fetch `Inter` ».
// Voir app/fonts/LICENCE.txt.
const inter = localFont({
  src: './fonts/inter-latin-variable.woff2',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: 'Manei-Lift - GMAO Ascenseurs',
  description: 'Maquette GMAO Manei-Lift : pilotage du parc, interventions, maintenances et CTQ pour la gestion d\'un parc d\'ascenseurs',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <CommandPaletteProvider>
          <AppShell>{children}</AppShell>

          {/* Command Palette global */}
          <CommandPalette />
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
