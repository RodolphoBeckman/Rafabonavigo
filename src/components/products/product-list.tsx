"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { Edit, Trash2, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';


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
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold font-headline">Nenhum produto cadastrado</h2>
        <p className="text-muted-foreground">Comece adicionando seu primeiro produto.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <CardHeader className="relative">
            <div className="aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
              {product.photoUrl ? (
                <Image
                  src={product.photoUrl}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  data-ai-hint="product image"
                />
              ) : (
                <Image
                  src={`https://placehold.co/200x200.png`}
                  alt="Placeholder"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover opacity-50"
                   data-ai-hint="product placeholder"
                />
              )}
            </div>
             <div className="absolute top-4 right-4">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardTitle className="text-lg font-headline mb-2">{product.name}</CardTitle>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
              <Badge variant={product.quantity > 0 ? 'default' : 'destructive'} className="bg-accent text-accent-foreground">
                {product.quantity} em estoque
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button variant="destructive" className="w-full" onClick={() => onDelete(product.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
