"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useLocalStorage from "@/hooks/use-local-storage";
import type { Sale, Purchase, AccountReceivable, Client, Supplier, CashAdjustment, AppSettings } from "@/lib/types";
import { Calendar as CalendarIcon, FileDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
};

const adjustmentSchema = z.object({
  type: z.enum(['add', 'remove'], { required_error: "Selecione o tipo de movimentação." }),
  amount: z.coerce.number().positive("O valor deve ser um número positivo."),
  description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres."),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export function CashFlowReport() {
  const { toast } = useToast();
  const [sales] = useLocalStorage<Sale[]>('sales', []);
  const [purchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [receivables, setReceivables] = useLocalStorage<AccountReceivable[]>('receivables', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [cashAdjustments, setCashAdjustments] = useLocalStorage<CashAdjustment[]>('cash-adjustments', []);
  const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
  
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setDate({ from: addDays(new Date(), -30), to: new Date() });
  }, []);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      amount: 0,
      description: ""
    }
  });

  const onAdjustmentSubmit = (values: AdjustmentFormValues) => {
    const newAdjustment: CashAdjustment = {
      id: new Date().toISOString(),
      date: new Date().toISOString(),
      type: values.type,
      amount: values.amount,
      description: values.description,
    };
    setCashAdjustments([...cashAdjustments, newAdjustment]);
    toast({ title: "Movimentação registrada!", description: "O seu caixa foi atualizado." });
    form.reset();
  };
  
  const paidReceivables = receivables.filter(r => r.status === 'paid');

  const allTransactions: Transaction[] = useMemo(() => {
    const saleTransactions: Transaction[] = sales
      .filter(sale => sale.paymentMethod !== 'a_prazo')
      .map(sale => ({
        id: `sale-${sale.id}`, date: sale.date,
        description: `Venda para ${sale.clientId ? clients.find(c => c.id === sale.clientId)?.name || 'Cliente anônimo' : 'Venda balcão'}`,
        amount: sale.total, type: 'income'
      }));

    const purchaseTransactions: Transaction[] = purchases.map(purchase => ({
      id: `purchase-${purchase.id}`, date: purchase.date,
      description: `Compra de ${suppliers.find(s => s.id === purchase.supplierId)?.name || 'Fornecedor'}`,
      amount: -purchase.total, type: 'expense'
    }));

    const receivableTransactions: Transaction[] = paidReceivables.map(r => ({
        id: `receivable-${r.id}`, date: r.paidDate || new Date().toISOString(),
        description: `Recebimento de ${clients.find(c => c.id === r.clientId)?.name || 'Cliente anônimo'}`,
        amount: r.amount, type: 'income'
    }));
      
    const adjustmentTransactions: Transaction[] = cashAdjustments.map(adj => ({
        id: `adj-${adj.id}`, date: adj.date, description: adj.description,
        amount: adj.type === 'add' ? adj.amount : -adj.amount,
        type: adj.type === 'add' ? 'income' : 'expense'
      }));

    return [...saleTransactions, ...purchaseTransactions, ...receivableTransactions, ...adjustmentTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, purchases, paidReceivables, clients, suppliers, cashAdjustments]);
  
  const filteredTransactions = useMemo(() => {
    if (!date?.from) return [];
    const from = date.from;
    const to = date.to ? addDays(date.to, 1) : addDays(from, 1);
    return allTransactions.filter(t => new Date(t.date) >= from && new Date(t.date) < to);
  }, [allTransactions, date]);
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [filteredTransactions]);
  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0), [filteredTransactions]);
  const balance = totalIncome - totalExpense;

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
    <div className="space-y-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="font-headline">Relatório de Caixa</CardTitle>
                                <p className="text-sm text-muted-foreground">Visualize o fluxo de entradas e saídas.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>) : (format(date.from, "dd/MM/yy"))) : (<span>Escolha um período</span>)}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                                    </PopoverContent>
                                </Popover>
                                <Button onClick={handleDownloadPdf} disabled={filteredTransactions.length === 0}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-6">
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                              <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                            </CardContent>
                          </Card>
                           <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
                              <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
                            </CardContent>
                          </Card>
                           <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
                            </CardContent>
                          </Card>
                      </div>

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
                            filteredTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  <div className="font-medium">{transaction.description}</div>
                                  <div className={`text-sm ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{transaction.type === 'income' ? 'Entrada' : 'Saída'}</div>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transaction.amount)}</TableCell>
                                <TableCell className="hidden md:table-cell text-right text-muted-foreground">{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhuma transação no período.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Movimentar Caixa</CardTitle>
                        <CardDescription>Adicione ou remova valores do caixa manualmente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAdjustmentSubmit)} className="space-y-4">
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="add">Adicionar (Entrada)</SelectItem>
                                                <SelectItem value="remove">Remover (Saída)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl><Input placeholder="Ex: Pagamento de conta" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" className="w-full">Registrar Movimentação</Button>
                            </form>
                        </Form>
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
