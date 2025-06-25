"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, X, Trash2, PlusCircle, UserCheck } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Product, Client, Sale, SaleItem, AccountReceivable } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const saleSchema = z.object({
  paymentMethod: z.enum(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'a_prazo']),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export function NewSale() {
  const { toast } = useToast();
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
  const [receivables, setReceivables] = useLocalStorage<AccountReceivable[]>('receivables', []);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { paymentMethod: 'dinheiro' },
  });

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.quantity > 0);
  }, [productSearch, products]);

  const filteredClients = useMemo(() => {
    if (clientSearch.length < 3) return [];
    const term = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.cpfCnpj.includes(term) ||
      c.phone.includes(term)
    );
  }, [clientSearch, clients]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.quantity) {
          return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        toast({ title: "Estoque insuficiente", description: `A quantidade de ${product.name} no carrinho já atingiu o limite do estoque.`, variant: "destructive"});
        return prev;
      }
      return [...prev, { productId: product.id, quantity: 1, unitPrice: product.price }];
    });
    setProductSearch('');
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > 0 && quantity <= product.quantity) {
      setCart(cart.map(item => item.productId === productId ? { ...item, quantity } : item));
    } else if (quantity > product.quantity) {
      toast({ title: "Estoque insuficiente", description: `Apenas ${product.quantity} unidades de ${product.name} disponíveis.`, variant: "destructive"});
    }
  };

  const total = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const onSubmit = (data: SaleFormValues) => {
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione produtos ao carrinho antes de finalizar a venda.", variant: "destructive" });
      return;
    }
    
    if (data.paymentMethod === 'a_prazo' && !selectedClient) {
      toast({ title: "Cliente não selecionado", description: "Para vendas a prazo, é necessário selecionar um cliente.", variant: "destructive" });
      return;
    }

    const newSale: Sale = {
      id: new Date().toISOString(),
      items: cart,
      total,
      paymentMethod: data.paymentMethod,
      date: new Date().toISOString(),
      clientId: selectedClient?.id,
    };
    
    setSales([...sales, newSale]);

    const newProducts = [...products];
    cart.forEach(item => {
      const productIndex = newProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        newProducts[productIndex].quantity -= item.quantity;
      }
    });
    setProducts(newProducts);
    
    if(data.paymentMethod === 'a_prazo' && selectedClient) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days to pay
        const newReceivable: AccountReceivable = {
            id: new Date().toISOString(),
            saleId: newSale.id,
            clientId: selectedClient.id,
            amount: total,
            dueDate: dueDate.toISOString(),
            status: 'pending',
        }
        setReceivables([...receivables, newReceivable]);
    }

    toast({ title: "Venda realizada com sucesso!", variant: 'default' });
    setCart([]);
    setSelectedClient(null);
    setClientSearch('');
    form.reset();
  };

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Produto desconhecido';
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Registrar Nova Venda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium">Buscar Cliente (opcional)</label>
            {selectedClient ? (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <UserCheck className="h-4 w-4 !text-blue-600" />
                    <AlertTitle className="text-blue-800">Cliente Selecionado</AlertTitle>
                    <AlertDescription className="flex justify-between items-center text-blue-700">
                        {selectedClient.name}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedClient(null); setClientSearch(''); }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : (
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Digite nome, CPF/CNPJ ou telefone do cliente..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </PopoverTrigger>
                    {filteredClients.length > 0 && (
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <ul className="space-y-1 p-2">
                                {filteredClients.map(client => (
                                    <li key={client.id} onClick={() => { setSelectedClient(client); setClientSearch(''); }}
                                        className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm">
                                        {client.name} - {client.cpfCnpj}
                                    </li>
                                ))}
                            </ul>
                        </PopoverContent>
                    )}
                </Popover>
            )}
        </div>

        <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Produtos</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produto por nome..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
              </PopoverTrigger>
              {filteredProducts.length > 0 && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <ul className="space-y-1 p-2">
                    {filteredProducts.map(product => (
                      <li key={product.id} onClick={() => addToCart(product)}
                          className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm flex justify-between">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(product.price)}</span>
                      </li>
                    ))}
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
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cart.length > 0 ? cart.map(item => (
                        <TableRow key={item.productId}>
                            <TableCell>{getProductName(item.productId)}</TableCell>
                            <TableCell>
                                <Input type="number" value={item.quantity} 
                                       onChange={e => updateQuantity(item.productId, parseInt(e.target.value))}
                                       className="h-8 w-20" min="1"/>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)}>
                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">O carrinho está vazio.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>

        <div className="flex justify-between items-center">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
                <Select onValueChange={(value) => form.setValue('paymentMethod', value as SaleFormValues['paymentMethod'])} defaultValue="dinheiro">
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="a_prazo">A Prazo</SelectItem>
                    </SelectContent>
                </Select>
                 <Button type="submit" size="lg">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Finalizar Venda
                </Button>
            </form>
            <div className="text-right">
                <p className="text-muted-foreground">Total</p>
                <p className="text-3xl font-bold font-headline">{formatCurrency(total)}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
