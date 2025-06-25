"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import type { Client } from '@/lib/types';
import { ClientForm } from '@/components/clients/client-form';
import { ClientList } from '@/components/clients/client-list';
import useLocalStorage from '@/hooks/use-local-storage';
import { PageHeader } from '@/components/page-header';

export default function ClientsPage() {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm('Tem certeza que deseja remover este cliente?')) {
      setClients(clients.filter((c) => c.id !== clientId));
    }
  };

  const handleFormSubmit = (client: Omit<Client, 'id'>) => {
    if (selectedClient) {
      setClients(clients.map((c) => (c.id === selectedClient.id ? { ...c, ...client } : c)));
    } else {
      setClients([...clients, { ...client, id: new Date().toISOString() }]);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Clientes" description="Adicione, edite e visualize os dados dos seus clientes.">
        <Button onClick={handleAddClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </PageHeader>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{selectedClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={selectedClient}
            onSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
      
      <ClientList
        clients={clients}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
      />
    </div>
  );
}
