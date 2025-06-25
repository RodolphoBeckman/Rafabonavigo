"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import type { Supplier } from '@/lib/types';
import { SupplierForm } from '@/components/suppliers/supplier-form';
import { SupplierList } from '@/components/suppliers/supplier-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { PageHeader } from '@/components/page-header';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm('Tem certeza que deseja remover este fornecedor?')) {
      setSuppliers(suppliers.filter((s) => s.id !== supplierId));
    }
  };

  const handleFormSubmit = (supplier: Omit<Supplier, 'id'>) => {
    if (selectedSupplier) {
      setSuppliers(suppliers.map((s) => (s.id === selectedSupplier.id ? { ...s, ...supplier } : s)));
    } else {
      setSuppliers([...suppliers, { ...supplier, id: new Date().toISOString() }]);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Fornecedores" description="Gerencie as informações dos seus fornecedores.">
        <Button onClick={handleAddSupplier}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </PageHeader>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
      
      <SupplierList
        suppliers={suppliers}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
      />
    </div>
  );
}
