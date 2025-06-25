'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, LayoutDashboard, Users, Receipt, Settings, ClipboardList, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useLocalStorage from '@/hooks/use-local-storage';
import type { AppSettings } from '@/lib/types';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/sales', label: 'Vendas', icon: ShoppingCart },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/accounts-receivable', label: 'Contas a Receber', icon: Receipt },
    { href: '/management', label: 'Gestão', icon: ClipboardList },
    { href: '/reports', label: 'Relatórios', icon: BarChart3 },
    { href: '/settings', label: 'Configurações', icon: Settings },
];

export function AppHeader() {
    const pathname = usePathname();
    const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <header className="bg-card shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="text-center py-4 border-b flex justify-center items-center gap-3">
                    {isClient && settings.logoUrl && (
                        <Image src={settings.logoUrl} alt="Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                    )}
                    <h1 className="text-2xl font-bold font-headline">{isClient ? settings.appName : 'StockPilot'}</h1>
                </div>
                <nav className="flex justify-center">
                    <ul className="flex items-center space-x-1 sm:space-x-2 p-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                                        pathname === item.href
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="hidden sm:inline-block">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
