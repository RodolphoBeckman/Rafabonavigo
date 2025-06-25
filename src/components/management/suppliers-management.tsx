"use client";

import { useState } from 'react';
import type { Supplier } from '@/lib/types';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { SupplierList } from '@/components/suppliers/supplier-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function SuppliersManagement() {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('Tem certeza que deseja remover este fornecedor?')) {
      setSuppliers(suppliers.filter((p) => p.id !== supplierId));
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(null);
      }
    }
  };

  const handleFormSubmit = (supplier: Omit<Supplier, 'id'>) => {
    if (selectedSupplier) {
      setSuppliers(suppliers.map((p) => (p.id === selectedSupplier.id ? { ...p, ...supplier, id: p.id } : p)));
    } else {
      setSuppliers([...suppliers, { ...supplier, id: new Date().toISOString() }]);
    }
    setSelectedSupplier(null);
  };

  const handleCancelEdit = () => {
    setSelectedSupplier(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">{selectedSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</CardTitle>
            </CardHeader>
            <CardContent>
                <SupplierForm
                    key={selectedSupplier ? selectedSupplier.id : 'new'}
                    supplier={selectedSupplier}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelEdit}
                />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Fornecedores Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
                <SupplierList
                    suppliers={suppliers}
                    onEdit={handleEditSupplier}
                    onDelete={handleDeleteSupplier}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
