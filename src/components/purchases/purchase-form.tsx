"use client";

import { useState, useMemo } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Trash2, PlusCircle } from 'lucide-react';
import type { Product, Supplier, Purchase, PurchaseItem } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'É necessário selecionar um fornecedor.'),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export function PurchaseForm() {
  const { toast } = useToast();
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
  
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
  });

  const availableProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [productSearch, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price }];
    });
    setProductSearch('');
  };

  const removeFromCart = (productId: string) => setCart(cart.filter(item => item.productId !== productId));
  const updateCartItem = (productId: string, newValues: Partial<PurchaseItem>) => {
    setCart(cart.map(item => item.productId === productId ? { ...item, ...newValues } : item));
  };

  const total = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const onSubmit = (data: PurchaseFormValues) => {
    if (cart.length === 0) {
      toast({ title: "Nenhum produto adicionado", description: "Adicione produtos para registrar a compra.", variant: "destructive" });
      return;
    }

    const newPurchase: Purchase = {
      id: new Date().toISOString(),
      items: cart,
      total,
      supplierId: data.supplierId,
      date: new Date().toISOString(),
    };
    setPurchases([...purchases, newPurchase]);

    const newProducts = [...products];
    cart.forEach(item => {
      const productIndex = newProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        newProducts[productIndex].quantity += item.quantity;
      }
    });
    setProducts(newProducts);

    toast({ title: "Compra registrada com sucesso!" });
    setCart([]);
    form.reset();
  };
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Registrar Nova Compra</CardTitle>
      </CardHeader>
      <CardContent as="form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Select onValueChange={(value) => form.setValue('supplierId', value)} >
            <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
                {suppliers.length > 0 ? suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) : <SelectItem value="-" disabled>Nenhum fornecedor cadastrado</SelectItem>}
            </SelectContent>
        </Select>
        {form.formState.errors.supplierId && <p className="text-sm font-medium text-destructive">{form.formState.errors.supplierId.message}</p>}
        
        <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Produtos</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar produto por nome..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-8"/>
                </div>
              </PopoverTrigger>
              {availableProducts.length > 0 && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ul className="space-y-1 p-2">
                    {availableProducts.map(p => <li key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm">{p.name}</li>)}
                  </ul>
                </PopoverContent>
              )}
            </Popover>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-[100px]">Qtd.</TableHead>
                <TableHead className="w-[120px]">Preço Unit.</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length > 0 ? cart.map(item => (
                <TableRow key={item.productId}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>
                    <Input type="number" value={item.quantity} onChange={e => updateCartItem(item.productId, { quantity: parseInt(e.target.value) || 0 })} className="h-8 w-20"/>
                  </TableCell>
                  <TableCell>
                    <Input type="number" step="0.01" value={item.unitPrice} onChange={e => updateCartItem(item.productId, { unitPrice: parseFloat(e.target.value) || 0 })} className="h-8 w-24"/>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhum produto adicionado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <Button type="submit" size="lg"><PlusCircle className="mr-2 h-4 w-4"/>Registrar Compra</Button>
          <div className="text-right">
            <p className="text-muted-foreground">Total da Compra</p>
            <p className="text-3xl font-bold font-headline">{formatCurrency(total)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
