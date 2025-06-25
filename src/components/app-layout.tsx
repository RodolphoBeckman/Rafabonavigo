"use client";

import React from 'react';
import { AppHeader } from './header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {children}
      </main>
    </>
  );
}
