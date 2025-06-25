"use client";

import { PageHeader } from "@/components/page-header";
import { ReceivablesList } from "@/components/accounts-receivable/receivables-list";

export default function AccountsReceivablePage() {
    return (
        <div className="container mx-auto py-8">
            <PageHeader title="Contas a Receber" description="Gerencie as vendas a prazo e controle os recebimentos."/>
            <ReceivablesList />
        </div>
    );
}
