"use client";

import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PurchaseList } from "@/components/purchases/purchase-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PurchasesManagement() {
    return (
        <div className="pt-6">
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
