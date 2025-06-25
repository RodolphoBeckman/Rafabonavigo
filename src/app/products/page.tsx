"use client";

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductForm } from '@/components/products/product-form';
import { ProductList } from '@/components/products/product-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ProductsPage() {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Tem certeza que deseja remover este produto?')) {
      setProducts(products.filter((p) => p.id !== productId));
      if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
      }
    }
  };

  const handleFormSubmit = (product: Omit<Product, 'id' | 'photoUrl'> & { photoUrl?: string }) => {
    if (selectedProduct) {
      setProducts(products.map((p) => (p.id === selectedProduct.id ? { ...p, ...product, id: p.id } : p)));
    } else {
      setProducts([...products, { ...product, id: new Date().toISOString() }]);
    }
    setSelectedProduct(null);
  };

  const handleCancelEdit = () => {
    setSelectedProduct(null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">{selectedProduct ? 'Editar Produto' : 'Cadastrar Produto'}</CardTitle>
            </CardHeader>
            <CardContent>
                <ProductForm
                    key={selectedProduct ? selectedProduct.id : 'new'}
                    product={selectedProduct}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelEdit}
                />
            </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-3">
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Produtos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
                <ProductList
                    products={products}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
