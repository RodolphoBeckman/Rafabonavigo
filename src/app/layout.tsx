'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster";
import useLocalStorage from '@/hooks/use-local-storage';
import type { AppSettings } from '@/lib/types';
import { SplashScreen } from '@/components/splash-screen';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Duração da splash screen em milissegundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{isClient ? settings.appName : 'StockPilot'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {isClient && isLoading ? (
          <SplashScreen appName={settings.appName} logoUrl={settings.logoUrl} />
        ) : (
          <div className="animate-fade-in">
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </div>
        )}
      </body>
    </html>
  );
}
