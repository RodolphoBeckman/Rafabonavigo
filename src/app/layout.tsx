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

  useEffect(() => {
    if (!isClient) return;

    // --- PWA and dynamic metadata setup ---

    const appName = settings.appName || 'StockPilot';
    const logoUrl = settings.logoUrl;

    // Dynamically update document title
    document.title = appName;

    // --- Create fallback icon if no logo is provided ---
    const getFallbackIcon = (size: number) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="hsl(327 82% 55%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="M16.5 9.4a.5.5 0 0 0-.5-.4h-10a.5.5 0 0 0-.5.4L3.6 14H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-1.6l-1.9-4.6Z"/><path d="M3.8 9.6L12 4.8l8.2 4.8"/><path d="M12 14.4V4.8"/><path d="M22 18h-5.2"/></svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    const finalLogoUrl = logoUrl || getFallbackIcon(512);
    
    let mimeType = 'image/svg+xml';
    if (logoUrl) {
      try {
        // A simple parser for the mime type from a data URI
        mimeType = logoUrl.substring(logoUrl.indexOf(':') + 1, logoUrl.indexOf(';'));
      } catch (e) {
        console.warn("Could not parse mime type from logoUrl, falling back to image/png");
        mimeType = 'image/png';
      }
    }

    // --- Set standard PWA meta tags ---
    const metaTags: { [key: string]: { name: string; content: string } } = {
        'theme-color': { name: 'theme-color', content: '#FFFFFF' },
        'apple-mobile-web-app-capable': { name: 'apple-mobile-web-app-capable', content: 'yes' },
        'apple-mobile-web-app-status-bar-style': { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        'apple-mobile-web-app-title': { name: 'apple-mobile-web-app-title', content: appName }
    };

    Object.values(metaTags).forEach(tagInfo => {
        let element = document.querySelector(`meta[name="${tagInfo.name}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('name', tagInfo.name);
            document.head.appendChild(element);
        }
        element.setAttribute('content', tagInfo.content);
    });

    // --- Set Apple Touch Icon ---
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
        document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = finalLogoUrl;

    // --- Dynamically create and inject the web app manifest ---
    const manifest = {
        name: appName,
        short_name: appName,
        description: `Gerenciador de estoque e vendas - ${appName}`,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            { src: finalLogoUrl, sizes: '192x192', type: mimeType, purpose: 'any maskable' },
            { src: finalLogoUrl, sizes: '512x512', type: mimeType, purpose: 'any maskable' }
        ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.setAttribute('rel', 'manifest');
        document.head.appendChild(manifestLink);
    }
    manifestLink.setAttribute('href', manifestUrl);

    // Cleanup object URL on component unmount
    return () => {
        URL.revokeObjectURL(manifestUrl);
    };

  }, [isClient, settings]);


  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Title is set dynamically in useEffect */}
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
