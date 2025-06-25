"use client";

import { useState } from 'react';
import type { Supplier } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search, Building, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface SupplierListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

export function SupplierList({ suppliers, onEdit, onDelete }: SupplierListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Buscar fornecedor..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="space-y-2 h-[500px] overflow-y-auto pr-2">
            {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="flex items-center p-3 border rounded-md hover:bg-accent/50">
                        <div className="flex-grow cursor-pointer" onClick={() => onEdit(supplier)}>
                            <p className="font-semibold text-sm">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.cnpj}</p>
                            <p className="text-xs text-muted-foreground">{supplier.phone} | {supplier.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(supplier.id)}}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground h-full min-h-[300px]">
                    <Building className="w-16 h-16 mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum fornecedor cadastrado</h3>
                    <p className="text-sm">Comece adicionando seus fornecedores.</p>
                </div>
            )}
        </div>
    </div>
  );
}
