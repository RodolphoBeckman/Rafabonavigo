"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Sale, Purchase, AccountReceivable, Client } from "@/lib/types";
import { Landmark, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useMemo } from "react";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
};

export default function DashboardPage() {
  const [sales] = useLocalStorage<Sale[]>('sales', []);
  const [purchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [receivables] = useLocalStorage<AccountReceivable[]>('receivables', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  
  const paidReceivables = receivables.filter(r => r.status === 'paid');

  const allTransactions: Transaction[] = useMemo(() => {
    const saleTransactions: Transaction[] = sales
      .filter(sale => sale.paymentMethod !== 'a_prazo')
      .map(sale => ({
        id: `sale-${sale.id}`,
        date: sale.date,
        description: `Venda para ${sale.clientId ? clients.find(c => c.id === sale.clientId)?.name || 'Cliente anônimo' : 'Venda balcão'}`,
        amount: sale.total,
        type: 'income'
      }));

    const purchaseTransactions: Transaction[] = purchases.map(purchase => ({
      id: `purchase-${purchase.id}`,
      date: purchase.date,
      description: `Compra de fornecedor`,
      amount: -purchase.total,
      type: 'expense'
    }));

    const receivableTransactions: Transaction[] = paidReceivables.map(r => ({
        id: `receivable-${r.id}`,
        date: r.paidDate || new Date().toISOString(),
        description: `Recebimento de ${clients.find(c => c.id === r.clientId)?.name || 'Cliente anônimo'}`,
        amount: r.amount,
        type: 'income'
    }));

    return [...saleTransactions, ...purchaseTransactions, ...receivableTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, purchases, paidReceivables, clients]);

  const totalIncome = useMemo(() => allTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [allTransactions]);
  const totalExpense = useMemo(() => allTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0), [allTransactions]);
  const balance = totalIncome - totalExpense;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">Balanço total de entradas e saídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Vendas e recebimentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">Compras e despesas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="hidden md:table-cell text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className={`text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? 'Entrada' : 'Saída'}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {allTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma transação registrada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
