"use client";

import useLocalStorage from '@/hooks/use-local-storage';
import type { AccountReceivable, Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ReceivablesList() {
  const [receivables, setReceivables] = useLocalStorage<AccountReceivable[]>('receivables', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  const { toast } = useToast();

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleMarkAsPaid = (receivableId: string) => {
    setReceivables(receivables.map(r => 
      r.id === receivableId ? { ...r, status: 'paid', paidDate: new Date().toISOString() } : r
    ));
    toast({ title: "Conta marcada como paga!", description: "A entrada será refletida no caixa." });
  };
  
  const sortedReceivables = [...receivables].sort((a, b) => {
    if (a.status === b.status) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.status === 'pending' ? -1 : 1;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Controle de Contas a Receber</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReceivables.length > 0 ? (
              sortedReceivables.map(receivable => (
                <TableRow key={receivable.id}>
                  <TableCell className="font-medium">{getClientName(receivable.clientId)}</TableCell>
                  <TableCell>{new Date(receivable.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{formatCurrency(receivable.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={receivable.status === 'paid' ? 'default' : 'destructive'} className={receivable.status === 'paid' ? 'bg-green-500' : ''}>
                      {receivable.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {receivable.status === 'pending' && (
                      <Button size="sm" onClick={() => handleMarkAsPaid(receivable.id)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Marcar como Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Receipt className="w-16 h-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold font-headline">Nenhuma conta a receber</h2>
                    <p className="text-muted-foreground">Vendas a prazo aparecerão aqui para controle.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
