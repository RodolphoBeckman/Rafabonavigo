"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Supplier } from '@/lib/types';

const supplierSchema = z.object({
  name: z.string().min(3, { message: 'O nome da empresa deve ter pelo menos 3 caracteres.' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).or(z.literal('')).optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (data: Omit<Supplier, 'id'>) => void;
  onCancel?: () => void;
}

export function SupplierForm({ supplier, onSubmit, onCancel }: SupplierFormProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      cnpj: '',
      address: '',
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset(supplier);
    } else {
      form.reset({
        name: '',
        phone: '',
        email: '',
        cnpj: '',
        address: '',
      });
    }
  }, [supplier, form]);

  const handleSubmit = (values: SupplierFormValues) => {
    onSubmit(values as Omit<Supplier, 'id'>);
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
              <FormLabel>Nome da Empresa</FormLabel>
              <FormControl>
                <Input placeholder="Nome do fornecedor" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(11) 99999-9999" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contato@fornecedor.com" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea placeholder="Rua, número, bairro, cidade" {...field} value={field.value ?? ''}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col gap-2 pt-4">
          <Button type="submit" className="w-full">{supplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</Button>
          {supplier && onCancel && (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>Cancelar Edição</Button>
          )}
        </div>
      </form>
    </Form>
  );
}
