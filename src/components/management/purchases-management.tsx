"use client";

import { useState } from 'react';
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PurchaseList } from "@/components/purchases/purchase-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Purchase } from '@/lib/types';

export function PurchasesManagement() {
    const [activeTab, setActiveTab] = useState("new-purchase");
    const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);

    const handleEditPurchase = (purchase: Purchase) => {
        setPurchaseToEdit(purchase);
        setActiveTab("new-purchase");
    };

    const handleSuccess = () => {
        setPurchaseToEdit(null);
        setActiveTab("history");
    };

    const handleCancel = () => {
        setPurchaseToEdit(null);
        setActiveTab("history");
    };

    const handleTabChange = (value: string) => {
        if (purchaseToEdit && value !== 'new-purchase') {
            setPurchaseToEdit(null);
        }
        setActiveTab(value);
    };

    return (
        <div className="pt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="new-purchase">{purchaseToEdit ? 'Editar Compra' : 'Nova Compra'}</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Compras</TabsTrigger>
                </TabsList>
                <TabsContent value="new-purchase">
                     <PurchaseForm 
                        key={purchaseToEdit ? purchaseToEdit.id : 'new'}
                        purchaseToEdit={purchaseToEdit}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </TabsContent>
                <TabsContent value="history">
                    <PurchaseList onEdit={handleEditPurchase} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
