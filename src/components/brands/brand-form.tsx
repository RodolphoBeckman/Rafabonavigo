"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Brand } from '@/lib/types';

const brandSchema = z.object({
  name: z.string().min(2, { message: 'O nome da marca deve ter pelo menos 2 caracteres.' }),
});

type BrandFormValues = z.infer<typeof brandSchema>;

interface BrandFormProps {
  brand?: Brand | null;
  onSubmit: (data: BrandFormValues) => void;
  onCancel?: () => void;
}

export function BrandForm({ brand, onSubmit, onCancel }: BrandFormProps) {
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (brand) {
      form.reset(brand);
    } else {
      form.reset({ name: '' });
    }
  }, [brand, form]);

  const handleSubmit = (values: BrandFormValues) => {
    onSubmit(values);
    form.reset();
    if(onCancel) onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Marca</FormLabel>
              <FormControl>
                <Input placeholder="Nome da marca" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 pt-4">
          <Button type="submit" className="w-full">{brand ? 'Salvar Alterações' : 'Cadastrar Marca'}</Button>
          {brand && onCancel && (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>Cancelar Edição</Button>
          )}
        </div>
      </form>
    </Form>
  );
}
