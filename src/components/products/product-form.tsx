"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product, Supplier, Brand } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import useLocalStorage from '@/hooks/use-local-storage';

const productSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  price: z.coerce.number().positive({ message: 'O preço de venda deve ser um número positivo.' }),
  costPrice: z.coerce.number().min(0, { message: 'O preço de custo não pode ser negativo.' }).optional(),
  quantity: z.coerce.number().int().min(0, { message: 'A quantidade não pode ser negativa.' }),
  photo: z.any().optional(),
  supplierId: z.string().optional(),
  brandId: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: Omit<Product, 'id' | 'photoUrl'> & { photoUrl?: string }) => void;
  onCancel?: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [brands] = useLocalStorage<Brand[]>('brands', []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', price: 0, costPrice: 0, quantity: 0, photo: undefined, supplierId: '', brandId: '' },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        quantity: product.quantity,
        supplierId: product.supplierId,
        brandId: product.brandId,
      });
      setPhotoPreview(product.photoUrl || null);
    } else {
      form.reset({ name: '', price: 0, costPrice: 0, quantity: 0, photo: undefined, supplierId: '', brandId: '' });
      setPhotoPreview(null);
    }
  }, [product, form]);

  const handleFormSubmit = async (values: ProductFormValues) => {
    let photoUrl: string | undefined = product?.photoUrl;
    
    if (photoPreview && photoPreview !== product?.photoUrl) {
      photoUrl = photoPreview;
    }

    const dataToSubmit = {
      ...values,
      photoUrl,
      supplierId: values.supplierId === 'none' ? undefined : values.supplierId,
      brandId: values.brandId === 'none' ? undefined : values.brandId,
    };
    
    onSubmit(dataToSubmit);
    form.reset({ name: '', price: 0, costPrice: 0, quantity: 0, photo: undefined, supplierId: '', brandId: '' });
    setPhotoPreview(null);
  };
  
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Arquivo muito grande", description: "A imagem deve ser menor que 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {photoPreview && (
          <div className="flex justify-center pb-4">
            <Image
              src={photoPreview}
              alt="Pré-visualização do produto"
              width={80}
              height={80}
              className="rounded-md object-cover"
              data-ai-hint="product image"
            />
          </div>
        )}
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Venda (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="Ex: 29.99" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Custo (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="Ex: 19.99" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                   <SelectItem value="none">Nenhuma</SelectItem>
                  {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto do Produto</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </FormControl>
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
