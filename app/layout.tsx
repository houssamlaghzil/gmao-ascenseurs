import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';
import QueryProvider from '@/lib/react-query/QueryProvider';
import CommandPalette from '@/components/CommandPalette';
import { CommandPaletteProvider } from '@/lib/contexts/CommandPaletteContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GMAO Ascenseurs - Démo',
  description: 'Démonstration GMAO pour parcs d\'ascenseurs avec maintenance prédictive',
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
              <Navigation />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="bg-white/50 backdrop-blur border-t border-gray-200 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <p className="text-center text-sm text-gray-600">
                  © 2024 GMAO Ascenseurs - Démonstration avec maintenance prédictive
                </p>
              </div>
            </footer>
          </div>
          
            {/* Command Palette global */}
            <CommandPalette />
          </CommandPaletteProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
