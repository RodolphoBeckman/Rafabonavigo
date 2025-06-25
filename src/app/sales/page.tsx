"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { NewSale } from "@/components/sales/new-sale";
import { SalesHistory } from "@/components/sales/sales-history";

export default function SalesPage() {
  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Vendas" description="Registre novas vendas e consulte o histórico." />
      
      <Tabs defaultValue="new-sale">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="new-sale">Nova Venda</TabsTrigger>
          <TabsTrigger value="history">Histórico de Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="new-sale">
          <NewSale />
        </TabsContent>
        <TabsContent value="history">
          <SalesHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
