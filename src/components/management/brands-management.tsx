"use client";

import { useState } from 'react';
import type { Brand } from '@/lib/types';
import { BrandForm } from '@/components/brands/brand-form';
import { BrandList } from '@/components/brands/brand-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function BrandsManagement() {
  const [brands, setBrands] = useLocalStorage<Brand[]>('brands', []);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleDeleteBrand = (brandId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta marca?')) {
      setBrands(brands.filter((b) => b.id !== brandId));
      if (selectedBrand?.id === brandId) {
        setSelectedBrand(null);
      }
    }
  };

  const handleFormSubmit = (brandData: Omit<Brand, 'id'>) => {
    if (selectedBrand) {
      setBrands(brands.map((b) => (b.id === selectedBrand.id ? { ...b, ...brandData, id: b.id } : b)));
    } else {
      setBrands([...brands, { ...brandData, id: new Date().toISOString() }]);
    }
    setSelectedBrand(null);
  };

  const handleCancelEdit = () => {
    setSelectedBrand(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">{selectedBrand ? 'Editar Marca' : 'Cadastrar Marca'}</CardTitle>
            </CardHeader>
            <CardContent>
                <BrandForm
                    key={selectedBrand ? selectedBrand.id : 'new'}
                    brand={selectedBrand}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelEdit}
                />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Marcas Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
                <BrandList
                    brands={brands}
                    onEdit={handleEditBrand}
                    onDelete={handleDeleteBrand}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
