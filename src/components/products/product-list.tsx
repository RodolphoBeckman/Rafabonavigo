"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { Trash2, Edit, Package } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground h-full min-h-[300px]">
        <Package className="w-16 h-16 mb-4" />
        <h3 className="text-lg font-semibold">Nenhum produto cadastrado</h3>
        <p className="text-sm">Comece adicionando seu primeiro produto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 h-[500px] overflow-y-auto pr-2">
      {products.map((product) => (
        <div key={product.id} className="flex items-center p-2 border rounded-md hover:bg-accent/50 cursor-pointer" onClick={() => onEdit(product)}>
          <Image
            src={product.photoUrl || `https://placehold.co/64x64.png`}
            alt={product.name}
            width={48}
            height={48}
            className="rounded-md object-cover w-12 h-12 mr-4"
            data-ai-hint="product image"
          />
          <div className="flex-grow">
            <p className="font-semibold text-sm">{product.name}</p>
            <p className="text-sm text-primary font-medium">{formatCurrency(product.price)}</p>
            <p className="text-xs text-muted-foreground">Estoque: {product.quantity}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(product.id)}}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
