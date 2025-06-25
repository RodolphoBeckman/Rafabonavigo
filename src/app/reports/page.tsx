"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashFlowReport } from "@/components/reports/cash-flow-report";
import { SalesReport } from "@/components/reports/sales-report";
import { PurchasesReport } from "@/components/reports/purchases-report";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold font-headline">Relatórios</h1>
            <p className="text-muted-foreground">Analise o desempenho do seu negócio.</p>
        </div>
      <Tabs defaultValue="cash-flow" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cash-flow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>
        <TabsContent value="cash-flow">
          <CashFlowReport />
        </TabsContent>
        <TabsContent value="sales">
          <SalesReport />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
