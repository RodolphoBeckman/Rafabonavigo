"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductForm } from '@/components/products/product-form';
import { ProductList } from '@/components/products/product-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { PageHeader } from '@/components/page-header';

export default function ProductsPage() {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  const handleFormSubmit = (product: Omit<Product, 'id'>) => {
    if (selectedProduct) {
      setProducts(products.map((p) => (p.id === selectedProduct.id ? { ...p, ...product } : p)));
    } else {
      setProducts([...products, { ...product, id: new Date().toISOString() }]);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Produtos" description="Gerencie seus produtos, estoque e preços.">
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </PageHeader>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">{selectedProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={selectedProduct}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
      
      <ProductList
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
}
