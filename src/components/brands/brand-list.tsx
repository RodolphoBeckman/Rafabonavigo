"use client";

import type { Brand } from '@/lib/types';
import { Tag, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface BrandListProps {
  brands: Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (brandId: string) => void;
}

export function BrandList({ brands, onEdit, onDelete }: BrandListProps) {
  if (brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground h-full min-h-[300px]">
        <Tag className="w-16 h-16 mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma marca cadastrada</h3>
        <p className="text-sm">Comece adicionando suas marcas.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 h-[500px] overflow-y-auto pr-2">
        {brands.map((brand) => (
            <div key={brand.id} className="flex items-center p-3 border rounded-md hover:bg-accent/50">
                <div className="flex-grow cursor-pointer" onClick={() => onEdit(brand)}>
                    <p className="font-semibold text-sm">{brand.name}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(brand.id)}}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ))}
    </div>
  );
}
