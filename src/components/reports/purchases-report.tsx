"use client";

import { useState, useMemo } from "react";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import useLocalStorage from '@/hooks/use-local-storage';
import type { Purchase, Supplier, AppSettings } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, FileDown, Truck } from 'lucide-react';
import jsPDF from "jspdf";
import "jspdf-autotable";

export function PurchasesReport() {
  const [purchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const [settings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot', logoUrl: '' });
  const [date, setDate] = useState<DateRange | undefined>({ from: addDays(new Date(), -30), to: new Date() });

  const getSupplierName = (supplierId: string) => suppliers.find(s => s.id === supplierId)?.name || 'Fornecedor desconhecido';
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredPurchases = useMemo(() => {
    if (!date?.from) return [];
    const from = date.from;
    const to = date.to ? addDays(date.to, 1) : addDays(from, 1);
    return purchases.filter(p => {
        const pDate = new Date(p.date);
        return pDate >= from && pDate < to;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, date]);

  const totalPurchases = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.total, 0), [filteredPurchases]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Relatório de Compras - ${settings.appName}`, 14, 22);
    doc.setFontSize(11);
    const dateRangeText = `Período: ${date?.from ? format(date.from, 'dd/MM/yy') : ''} a ${date?.to ? format(date.to, 'dd/MM/yy') : ''}`;
    doc.text(dateRangeText, 14, 30);
    
    const body: any[] = [];
    filteredPurchases.forEach(purchase => {
        body.push([
            { content: `${getSupplierName(purchase.supplierId)} - ${new Date(purchase.date).toLocaleDateString('pt-BR')}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
        ]);
        purchase.items.forEach(item => {
            body.push([item.productName, item.quantity, formatCurrency(item.unitPrice), { content: formatCurrency(item.unitPrice * item.quantity), styles: { halign: 'right' } }]);
        });
         body.push([
            { content: 'Total da Compra', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatCurrency(purchase.total), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
    });
    
    (doc as any).autoTable({
      startY: 35,
      head: [['Produto', 'Qtd.', 'Preço Unit.', 'Subtotal']],
      body: body,
      foot: [
          [{ content: 'Total Geral de Compras', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230] } }, { content: formatCurrency(totalPurchases), styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 230, 230] } }],
      ],
      showFoot: 'lastPage',
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`relatorio-compras-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="pt-6">
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="font-headline">Relatório de Compras</CardTitle>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button id="date-purchases" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>) : (format(date.from, "dd/MM/yy"))) : (<span>Escolha um período</span>)}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleDownloadPdf} disabled={filteredPurchases.length === 0}><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredPurchases.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {filteredPurchases.map(purchase => (
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
                    <h2 className="text-xl font-semibold font-headline">Nenhuma compra no período</h2>
                    <p className="text-muted-foreground">Não há compras registradas para o período selecionado.</p>
                </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
