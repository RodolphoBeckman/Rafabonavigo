"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, ShoppingCart } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Sale, Client, Product } from '@/lib/types';

const paymentMethodLabels: { [key: string]: string } = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Débito',
  cartao_credito: 'Crédito',
  pix: 'PIX',
  a_prazo: 'A Prazo',
};

export function SalesHistory() {
  const [sales] = useLocalStorage<Sale[]>('sales', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  const [products] = useLocalStorage<Product[]>('products', []);
  const [searchTerm, setSearchTerm] = useState('');

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Venda balcão';
    return clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';
  };
  
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Produto desconhecido';
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const clientName = getClientName(sale.clientId).toLowerCase();
        const term = searchTerm.toLowerCase();
        return clientName.includes(term) || sale.id.includes(term);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, clients]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Histórico de Vendas</CardTitle>
        <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Buscar por cliente ou ID da venda..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent>
        {filteredSales.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredSales.map((sale) => (
              <AccordionItem value={sale.id} key={sale.id}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center flex-1">
                    <div className="text-left">
                        <p className="font-semibold">{getClientName(sale.clientId)}</p>
                        <p className="text-sm text-muted-foreground">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-primary">{formatCurrency(sale.total)}</p>
                        <Badge variant="outline">{paymentMethodLabels[sale.paymentMethod]}</Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{getProductName(item.productId)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(sale.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0))}</TableCell>
                        </TableRow>
                        {sale.discount > 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium text-destructive">Desconto</TableCell>
                                <TableCell className="text-right font-medium text-destructive">-{formatCurrency(sale.discount)}</TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(sale.total)}</TableCell>
                        </TableRow>
                    </TableFooter>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold font-headline">Nenhuma venda registrada</h2>
            <p className="text-muted-foreground">Realize a sua primeira venda para ver o histórico aqui.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
