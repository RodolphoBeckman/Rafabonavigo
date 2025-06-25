"use client";

import { PageHeader } from "@/components/page-header";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PurchaseList } from "@/components/purchases/purchase-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PurchasesPage() {
    return (
        <div className="container mx-auto py-8">
            <PageHeader title="Compras" description="Registre as compras de mercadorias de seus fornecedores."/>

            <Tabs defaultValue="new-purchase">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="new-purchase">Nova Compra</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
                </TabsList>
                <TabsContent value="new-purchase">
                    <PurchaseForm />
                </TabsContent>
                <TabsContent value="history">
                    <PurchaseList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
