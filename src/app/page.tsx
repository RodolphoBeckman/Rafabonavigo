"use client";

import { useState, useMemo } from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Sale, Purchase, AccountReceivable, Client, Product, AppSettings, Supplier } from "@/lib/types";
import { Landmark, Users, Package, CreditCard, FileDown, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const [products] = useLocalStorage<Product[]>('products', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot', logoUrl: '' });

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

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
      description: `Compra de ${suppliers.find(s => s.id === purchase.supplierId)?.name || 'Fornecedor'}`,
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
  }, [sales, purchases, paidReceivables, clients, suppliers]);

  const filteredTransactions = useMemo(() => {
    if (!date?.from) return allTransactions;
    const from = date.from;
    const to = date.to ? addDays(date.to, 1) : addDays(from, 1); // include the whole 'to' day
    return allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= from && tDate < to;
    })
  }, [allTransactions, date]);


  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0), [filteredTransactions]);
  const balance = totalIncome - totalExpense;

  const totalReceivables = useMemo(() => receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0), [receivables]);
  const stockValue = useMemo(() => products.reduce((acc, p) => acc + (p.costPrice || 0) * p.quantity, 0), [products]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Relatório de Fluxo de Caixa - ${settings.appName}`, 14, 22);
    doc.setFontSize(11);
    const dateRangeText = `Período: ${date?.from ? format(date.from, 'dd/MM/yy') : ''} a ${date?.to ? format(date.to, 'dd/MM/yy') : ''}`;
    doc.text(dateRangeText, 14, 30);

    (doc as any).autoTable({
      startY: 35,
      head: [['Data', 'Descrição', 'Tipo', 'Valor']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.description,
        t.type === 'income' ? 'Entrada' : 'Saída',
        { content: formatCurrency(t.amount), styles: { halign: 'right', textColor: t.type === 'income' ? [0,128,0] : [255,0,0] } },
      ]),
      foot: [
          [{ content: 'Total Entradas', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(totalIncome), styles: { halign: 'right', fontStyle: 'bold' } }],
          [{ content: 'Total Saídas', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(totalExpense), styles: { halign: 'right', fontStyle: 'bold' } }],
          [{ content: 'Saldo do Período', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(balance), styles: { halign: 'right', fontStyle: 'bold' } }],
      ],
      showFoot: 'lastPage',
      headStyles: { fillColor: [41, 128, 185] },
      footStyles: { fillColor: [230, 230, 230], textColor: [0,0,0] }
    });

    doc.save(`relatorio-caixa-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
            <p className="text-xs text-muted-foreground">Balanço do período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceivables)}</div>
            <p className="text-xs text-muted-foreground">Total de vendas a prazo pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{clients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados na base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
            <p className="text-xs text-muted-foreground">Baseado no preço de custo</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">Movimentação de Caixa</CardTitle>
                    <p className="text-sm text-muted-foreground">Visualize o fluxo de entradas e saídas.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                            date.to ? (
                                <>
                                {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                {format(date.to, "LLL dd, y", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y", { locale: ptBR })
                            )
                            ) : (
                            <span>Escolha um período</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleDownloadPdf} disabled={filteredTransactions.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 10).map((transaction) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada para o período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
           {filteredTransactions.length > 10 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                    Mostrando as 10 transações mais recentes. O relatório em PDF inclui todas as transações do período.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
