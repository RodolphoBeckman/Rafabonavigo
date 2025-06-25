
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuppliersManagement } from "@/components/management/suppliers-management";
import { BrandsManagement } from "@/components/management/brands-management";
import { PurchasesManagement } from "@/components/management/purchases-management";

export default function ManagementPage() {
  return (
    <div>
      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers">
            <SuppliersManagement />
        </TabsContent>
        <TabsContent value="brands">
            <BrandsManagement />
        </TabsContent>
        <TabsContent value="purchases">
            <PurchasesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
