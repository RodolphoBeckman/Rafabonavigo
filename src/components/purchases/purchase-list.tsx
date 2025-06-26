"use client";

import useLocalStorage from '@/hooks/use-local-storage';
import type { Purchase, Supplier, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const paymentMethodLabels: { [key: string]: string } = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Débito',
  cartao_credito: 'Crédito',
  pix: 'PIX',
  boleto: 'Boleto',
};

interface PurchaseListProps {
  onEdit: (purchase: Purchase) => void;
}

export function PurchaseList({ onEdit }: PurchaseListProps) {
  const { toast } = useToast();
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);

  const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'Fornecedor desconhecido';
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleDelete = (purchaseId: string) => {
    if (!window.confirm('Tem certeza que deseja apagar esta compra? O estoque será ajustado permanentemente.')) {
      return;
    }

    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) {
      toast({ title: 'Erro', description: 'Compra não encontrada.', variant: 'destructive' });
      return;
    }

    // Revert stock quantities
    const updatedProducts = [...products];
    purchaseToDelete.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        updatedProducts[productIndex].quantity -= item.quantity;
      }
    });
    setProducts(updatedProducts);

    // Remove the purchase
    setPurchases(purchases.filter(p => p.id !== purchaseId));
    toast({ title: 'Compra apagada com sucesso!', description: 'O estoque foi atualizado.' });
  };

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
                <div className="flex items-center w-full">
                  <AccordionTrigger className="flex-1 p-4">
                    <div className="flex justify-between w-full items-center">
                      <div className="text-left">
                        <p className="font-semibold">{getSupplierName(purchase.supplierId)}</p>
                        <p className="text-sm text-muted-foreground">{new Date(purchase.date).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold text-lg text-primary">{formatCurrency(purchase.total)}</p>
                          <Badge variant="outline">{paymentMethodLabels[purchase.paymentMethod] || purchase.paymentMethod}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="mr-2 h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(purchase)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(purchase.id)} className="text-red-500 focus:text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                            <TableCell className="text-right">{formatCurrency(purchase.subtotal)}</TableCell>
                        </TableRow>
                        {purchase.shipping > 0 && (
                             <TableRow>
                                <TableCell colSpan={3} className="text-right">Frete</TableCell>
                                <TableCell className="text-right">{formatCurrency(purchase.shipping)}</TableCell>
                            </TableRow>
                        )}
                        {purchase.discount > 0 && (
                             <TableRow>
                                <TableCell colSpan={3} className="text-right text-destructive">Desconto</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(purchase.discount)}</TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(purchase.total)}</TableCell>
                        </TableRow>
                    </TableFooter>
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
