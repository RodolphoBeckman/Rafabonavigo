"use client";

import useLocalStorage from '@/hooks/use-local-storage';
import type { Purchase, Supplier } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck } from 'lucide-react';

export function PurchaseList() {
  const [purchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);

  const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'Fornecedor desconhecido';
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const sortedPurchases = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Histórico de Compras</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedPurchases.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {sortedPurchases.map(purchase => (
              <AccordionItem value={purchase.id} key={purchase.id}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-4 items-center">
                    <div className="text-left">
                      <p className="font-semibold">{getSupplierName(purchase.supplierId)}</p>
                      <p className="text-sm text-muted-foreground">{new Date(purchase.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <p className="font-bold text-lg text-primary">{formatCurrency(purchase.total)}</p>
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
                      {purchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Truck className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold font-headline">Nenhuma compra registrada</h2>
            <p className="text-muted-foreground">Registre sua primeira compra para ver o histórico aqui.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
