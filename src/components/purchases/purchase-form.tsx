
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'É necessário selecionar um fornecedor.'),
  paymentMethod: z.string().min(1, 'É necessário selecionar uma forma de pagamento.'),
  discount: z.coerce.number().min(0, "Desconto não pode ser negativo.").optional().default(0),
  shipping: z.coerce.number().min(0, "Frete não pode ser negativo.").optional().default(0),
});
type PurchaseFormValues = z.infer<typeof purchaseSchema>;

const newProductSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
    barcode: z.string().optional(),
    sellingPrice: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
    costPrice: z.coerce.number().min(0, "O preço de custo não pode ser negativo."),
});
type NewProductFormValues = z.infer<typeof newProductSchema>;


export function PurchaseForm() {
  const { toast } = useToast();
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
  
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      paymentMethod: '',
      discount: 0,
      shipping: 0
    }
  });

  const newProductForm = useForm<NewProductFormValues>({
      resolver: zodResolver(newProductSchema),
      defaultValues: {
          name: '',
          barcode: '',
          sellingPrice: 0,
          costPrice: 0,
      }
  });

  const availableProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(productSearch))
    );
  }, [productSearch, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.costPrice || 0 }];
    });
    setProductSearch('');
  };

  const handleProductSearchChange = (value: string) => {
    const foundProduct = products.find(p => p.barcode && p.barcode === value && p.barcode !== "");
    if (foundProduct) {
      addToCart(foundProduct);
      setProductSearch('');
    } else {
      setProductSearch(value);
    }
  };

  const removeFromCart = (productId: string) => setCart(cart.filter(item => item.productId !== productId));
  const updateCartItem = (productId: string, newValues: Partial<PurchaseItem>) => {
    setCart(cart.map(item => item.productId === productId ? { ...item, ...newValues } : item));
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0), [cart]);
  const discount = Number(form.watch('discount')) || 0;
  const shipping = Number(form.watch('shipping')) || 0;
  const total = subtotal - discount + shipping;

  const onSubmit = (data: PurchaseFormValues) => {
    if (cart.length === 0) {
      toast({ title: "Nenhum produto adicionado", description: "Adicione produtos para registrar a compra.", variant: "destructive" });
      return;
    }

    const newPurchase: Purchase = {
      id: new Date().toISOString(),
      items: cart,
      subtotal,
      discount: data.discount || 0,
      shipping: data.shipping || 0,
      total,
      supplierId: data.supplierId,
      date: new Date().toISOString(),
      paymentMethod: data.paymentMethod,
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
    form.reset({ supplierId: '', paymentMethod: '', discount: 0, shipping: 0 });
  };

  const handleAddNewProduct = (values: NewProductFormValues) => {
    const newProduct: Product = {
      id: new Date().toISOString(),
      name: values.name,
      barcode: values.barcode,
      price: values.sellingPrice,
      costPrice: values.costPrice,
      quantity: 0,
    };
    setProducts((prevProducts) => [...prevProducts, newProduct]);
    setCart(prev => {
        return [...prev, { productId: newProduct.id, productName: newProduct.name, quantity: 1, unitPrice: values.costPrice }];
    });
    toast({ title: `Produto "${newProduct.name}" cadastrado e adicionado à compra.` });
    setIsAddProductDialogOpen(false);
    newProductForm.reset();
    setProductSearch('');
  };
  
  const openNewProductDialog = () => {
    const isLikelyBarcode = /^\d{8,}$/.test(productSearch);
    if (isLikelyBarcode) {
      newProductForm.reset({
        name: '',
        barcode: productSearch,
        costPrice: 0,
        sellingPrice: 0
      });
    } else {
       newProductForm.reset({
        name: productSearch,
        barcode: '',
        costPrice: 0,
        sellingPrice: 0
      });
    }
    setIsAddProductDialogOpen(true);
  }
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Registrar Nova Compra</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fornecedor</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um fornecedor" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers.length > 0 ? suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) : <SelectItem value="-" disabled>Nenhum fornecedor cadastrado</SelectItem>}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="space-y-2">
                    <FormLabel>Adicionar Produtos</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por nome ou código de barras..." value={productSearch} onChange={e => handleProductSearchChange(e.target.value)} className="pl-8"/>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <ul className="space-y-1 p-2">
                          {availableProducts.map(p => <li key={p.id} onClick={() => addToCart(p)} className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm">{p.name}</li>)}
                        </ul>
                        {productSearch && (
                          <div className="p-2 border-t">
                            <Button variant="outline" type="button" className="w-full" onClick={openNewProductDialog}>
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Cadastrar novo produto
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
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
                            <Button variant="ghost" size="icon" type="button" onClick={() => removeFromCart(item.productId)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Nenhum produto adicionado.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                     <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Forma de Pagamento</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="shipping"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frete (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Desconto (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button type="submit" size="lg"><PlusCircle className="mr-2 h-4 w-4"/>Registrar Compra</Button>
                  <div className="text-right space-y-1">
                      <p className="text-muted-foreground text-sm">Subtotal: {formatCurrency(subtotal)}</p>
                      {shipping > 0 && <p className="text-muted-foreground text-sm">Frete: {formatCurrency(shipping)}</p>}
                      {discount > 0 && <p className="text-muted-foreground text-sm text-destructive">Desconto: -{formatCurrency(discount)}</p>}
                      <p className="text-muted-foreground">Total da Compra</p>
                      <p className="text-3xl font-bold font-headline">{formatCurrency(total)}</p>
                  </div>
                </div>
            </form>
        </Form>
      </CardContent>
    </Card>

    <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
      <DialogContent>
          <DialogHeader>
              <DialogTitle>Cadastrar Novo Produto</DialogTitle>
          </DialogHeader>
          <Form {...newProductForm}>
              <form onSubmit={newProductForm.handleSubmit(handleAddNewProduct)} className="space-y-4">
                  <FormField
                      control={newProductForm.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Nome do Produto</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                   <FormField
                      control={newProductForm.control}
                      name="barcode"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Código de Barras</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={newProductForm.control}
                        name="costPrice"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Preço de Custo (R$)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={newProductForm.control}
                        name="sellingPrice"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Preço de Venda (R$)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                  </div>
                  <DialogFooter>
                      <Button type="submit">Cadastrar e Adicionar</Button>
                  </DialogFooter>
              </form>
          </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
