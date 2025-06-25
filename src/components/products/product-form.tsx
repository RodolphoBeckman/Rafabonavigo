"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  price: z.coerce.number().positive({ message: 'O preço deve ser um número positivo.' }),
  quantity: z.coerce.number().int().min(0, { message: 'A quantidade não pode ser negativa.' }),
  photo: z.any().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: Omit<Product, 'id' | 'photoUrl'> & { photoUrl?: string }) => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: 0, quantity: 0, photo: undefined },
  });

  useEffect(() => {
    if (product) {
      form.reset({ name: product.name, price: product.price, quantity: product.quantity });
    } else {
      form.reset({ name: '', price: 0, quantity: 0, photo: undefined });
    }
  }, [product, form]);

  const handleFormSubmit = async (values: ProductFormValues) => {
    let photoUrl: string | undefined = product?.photoUrl;
    const file = values.photo?.[0];
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Arquivo muito grande", description: "A imagem deve ser menor que 2MB.", variant: "destructive" });
        return;
      }
      photoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });
    }
    
    onSubmit({ ...values, photoUrl });
    form.reset({ name: '', price: 0, quantity: 0, photo: undefined });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Produto</FormLabel>
              <FormControl><Input placeholder="Ex: Camiseta Branca" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço (R$)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="Ex: 29.99" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl><Input type="number" placeholder="Ex: 100" {...field} value={field.value ?? ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photo"
          render={({ field: { onChange, ...rest } }) => (
            <FormItem>
              <FormLabel>Foto do Produto</FormLabel>
              <FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 pt-4">
          <Button type="submit" className="w-full">{product ? 'Salvar Alterações' : 'Cadastrar Produto'}</Button>
          {product && onCancel && (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>Cancelar Edição</Button>
          )}
        </div>
      </form>
    </Form>
  );
}
