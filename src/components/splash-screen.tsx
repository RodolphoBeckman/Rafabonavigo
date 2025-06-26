'use client';

import Image from 'next/image';

interface SplashScreenProps {
  appName: string;
  logoUrl?: string | null;
}

export function SplashScreen({ appName, logoUrl }: SplashScreenProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in-scale">
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="App Logo"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg"
            priority
          />
        )}
        <h1 className="text-4xl font-bold font-headline text-foreground">
          {appName}
        </h1>
      </div>
    </div>
  );
}
