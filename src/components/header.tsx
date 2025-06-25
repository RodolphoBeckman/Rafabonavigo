'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, Landmark, Users, Receipt, Building, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/sales', label: 'Vendas', icon: ShoppingCart },
    { href: '/', label: 'Caixa', icon: Landmark },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/accounts-receivable', label: 'Contas a Receber', icon: Receipt },
    { href: '/suppliers', label: 'Fornecedores', icon: Building },
    { href: '/purchases', label: 'Compras', icon: Truck },
];

export function AppHeader() {
    const pathname = usePathname();

    return (
        <header className="bg-card shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="text-center py-4 border-b">
                    <h1 className="text-2xl font-bold font-headline">Controle de Mercadoria</h1>
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
