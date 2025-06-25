"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Landmark, Package, ShoppingCart, Users, Receipt, Building, Truck, Settings } from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Painel', icon: Landmark },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/sales', label: 'Vendas', icon: ShoppingCart },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/accounts-receivable', label: 'Contas a Receber', icon: Receipt },
  { href: '/suppliers', label: 'Fornecedores', icon: Building },
  { href: '/purchases', label: 'Compras', icon: Truck },
];

export function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center gap-2 font-headline font-bold text-xl">
            <CircleDollarSignIcon className="w-6 h-6 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">StockPilot</span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarMenu className="flex-1 p-4">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Button
              asChild
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className="w-full justify-start"
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function CircleDollarSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  )
}
