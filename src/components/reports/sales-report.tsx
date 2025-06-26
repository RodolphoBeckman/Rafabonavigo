"use client";

import { useState, useMemo, useEffect } from 'react';
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, FileDown, ShoppingCart } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Sale, Client, Product, AppSettings } from '@/lib/types';
import jsPDF from "jspdf";
import "jspdf-autotable";

const paymentMethodLabels: { [key: string]: string } = {
  dinheiro: 'Dinheiro',
  cartao_debito: 'Débito',
  cartao_credito: 'Crédito',
  pix: 'PIX',
  a_prazo: 'A Prazo',
};

export function SalesReport() {
  const [sales] = useLocalStorage<Sale[]>('sales', []);
  const [clients] = useLocalStorage<Client[]>('clients', []);
  const [products] = useLocalStorage<Product[]>('products', []);
  const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setDate({ from: addDays(new Date(), -30), to: new Date() });
  }, []);

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Venda balcão';
    return clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';
  };
  
  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Produto desconhecido';
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredSales = useMemo(() => {
    if (!date?.from) return [];
    const from = date.from;
    const to = date.to ? addDays(date.to, 1) : addDays(from, 1);
    return sales
      .filter(s => {
        const sDate = new Date(s.date);
        return sDate >= from && sDate < to;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, date]);

  const totalSales = useMemo(() => filteredSales.reduce((acc, sale) => acc + sale.total, 0), [filteredSales]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Vendas - ${settings.appName}`, 14, 22);
    doc.setFontSize(11);
    const dateRangeText = `Período: ${date?.from ? format(date.from, 'dd/MM/yy') : ''} a ${date?.to ? format(date.to, 'dd/MM/yy') : ''}`;
    doc.text(dateRangeText, 14, 30);
    
    const body: any[] = [];
    filteredSales.forEach(sale => {
        body.push([
            { content: `${getClientName(sale.clientId)} - ${new Date(sale.date).toLocaleDateString('pt-BR')}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: paymentMethodLabels[sale.paymentMethod], colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } }
        ]);
        sale.items.forEach(item => {
            body.push([getProductName(item.productId), item.quantity, formatCurrency(item.unitPrice), { content: formatCurrency(item.unitPrice * item.quantity), styles: { halign: 'right' } }]);
        });
         body.push([
            { content: 'Total da Venda', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrency(sale.total), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
    });

    (doc as any).autoTable({
      startY: 35,
      head: [['Produto', 'Qtd.', 'Preço Unit.', 'Subtotal']],
      body: body,
      foot: [
          [{ content: 'Total Geral de Vendas', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230] } }, { content: formatCurrency(totalSales), styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
      ],
      showFoot: 'lastPage',
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="pt-6">
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-headline">Relatório de Vendas</CardTitle>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button id="date-sales" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>) : (format(date.from, "dd/MM/yy"))) : (<span>Escolha um período</span>)}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
                <Button onClick={handleDownloadPdf} disabled={filteredSales.length === 0}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSales.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredSales.map((sale) => (
              <AccordionItem value={sale.id} key={sale.id}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-4 items-center">
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
            <h2 className="text-xl font-semibold font-headline">Nenhuma venda no período</h2>
            <p className="text-muted-foreground">Não há vendas registradas para o período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
