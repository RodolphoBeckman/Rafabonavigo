"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import type { AppSettings, BackupData } from '@/lib/types';
import { Settings, FileDown, FileUp } from 'lucide-react';
import Image from 'next/image';

const settingsSchema = z.object({
  appName: z.string().min(1, { message: 'O nome do aplicativo é obrigatório.' }),
  logoUrl: z.string().optional(),
  logoUpload: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.setValue('appName', settings.appName);
      form.setValue('logoUrl', settings.logoUrl || '');
      setLogoPreview(settings.logoUrl || null);
    }
  }, [settings, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit
        toast({ title: "Arquivo muito grande", description: "A imagem deve ser menor que 1MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        form.setValue('logoUrl', result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue('logoUrl', '', { shouldValidate: true });
  }

  const onSubmit = async (values: SettingsFormValues) => {
    setSettings({
      ...settings,
      appName: values.appName,
      logoUrl: values.logoUrl || undefined,
    });
    toast({ title: "Configurações salvas!", description: "Suas alterações foram salvas com sucesso." });
  };

  const handleExportData = () => {
    try {
      const dataToExport: Partial<BackupData> = {};
      const keysToExport: (keyof BackupData)[] = [
        'products', 'clients', 'suppliers', 'brands', 
        'sales', 'purchases', 'receivables', 'cashAdjustments', 'app-settings'
      ];
      
      keysToExport.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          dataToExport[key] = JSON.parse(item);
        }
      });

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `stockpilot_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Exportação concluída!", description: "O arquivo de backup foi baixado." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Erro na exportação", description: "Não foi possível exportar seus dados.", variant: "destructive" });
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
    } else {
      setImportFile(null);
      toast({ title: "Arquivo inválido", description: "Por favor, selecione um arquivo JSON.", variant: "destructive" });
    }
  };

  const handleImportData = () => {
    if (!importFile) {
      toast({ title: "Nenhum arquivo selecionado", description: "Selecione um arquivo para importar.", variant: "destructive" });
      return;
    }

    if (!window.confirm("Tem certeza que deseja importar os dados? As informações existentes serão mescladas com as do arquivo. Recomenda-se fazer um backup antes de continuar.")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not a string");
        
        const importedData = JSON.parse(text) as BackupData;
        
        const keysToMerge: (keyof Omit<BackupData, 'app-settings'>)[] = [
          'products', 'clients', 'suppliers', 'brands', 
          'sales', 'purchases', 'receivables', 'cashAdjustments'
        ];

        let itemsImported = 0;

        keysToMerge.forEach(key => {
            const existingItems: any[] = JSON.parse(localStorage.getItem(key) || '[]');
            const importedItems: any[] = importedData[key] || [];
            
            if(!Array.isArray(existingItems) || !Array.isArray(importedItems)) return;

            const existingIds = new Set(existingItems.map(item => item.id));
            const newItems = importedItems.filter(item => item.id && !existingIds.has(item.id));
            
            if (newItems.length > 0) {
                const mergedData = [...existingItems, ...newItems];
                localStorage.setItem(key, JSON.stringify(mergedData));
                itemsImported += newItems.length;
            }
        });
        
        if (importedData['app-settings']) {
            localStorage.setItem('app-settings', JSON.stringify(importedData['app-settings']));
        }

        toast({ title: "Importação concluída!", description: `${itemsImported} novos itens foram adicionados. A página será recarregada.` });

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: "Erro na importação", description: "O arquivo está corrompido ou em formato inválido.", variant: "destructive" });
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
            <Settings className="w-10 h-10 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Configurações</h1>
                <p className="text-muted-foreground">Personalize o nome e a logo do seu aplicativo.</p>
            </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="appName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Aplicativo</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da sua empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUpload"
                render={() => (
                   <FormItem>
                    <FormLabel>Logo do Aplicativo</FormLabel>
                    {logoPreview && (
                      <div className="mt-2 flex items-center gap-4">
                        <Image src={logoPreview} alt="Pré-visualização da logo" width={40} height={40} className="rounded-md object-contain" />
                        <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo}>Remover Logo</Button>
                      </div>
                    )}
                    <FormControl>
                      <Input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleLogoChange} className="pt-1.5"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">Salvar Alterações</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="font-semibold">Exportar Dados</h3>
            <p className="text-sm text-muted-foreground">
              Crie um backup de todos os dados do seu aplicativo (produtos, vendas, clientes, etc.) em um único arquivo JSON.
            </p>
            <Button onClick={handleExportData}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Backup
            </Button>
          </div>
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="font-semibold">Importar Dados</h3>
            <p className="text-sm text-muted-foreground">
             Importe dados de um arquivo de backup. Itens novos serão adicionados e os existentes serão mantidos. Recomenda-se exportar um backup antes de importar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
               <Input type="file" accept="application/json" onChange={handleImportFileChange} className="max-w-xs" />
               <Button onClick={handleImportData} disabled={!importFile}>
                <FileUp className="mr-2 h-4 w-4" />
                Importar e Mesclar
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
