"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import useLocalStorage from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import type { AppSettings } from '@/lib/types';
import { UploadCloud, Settings } from 'lucide-react';

const settingsSchema = z.object({
  appName: z.string().min(1, { message: 'O nome do aplicativo é obrigatório.' }),
  logo: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot', logoUrl: '' });
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.setValue('appName', settings.appName);
      setPreview(settings.logoUrl);
    }
  }, [settings, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit
        toast({ title: "Arquivo muito grande", description: "A imagem do logo deve ser menor que 1MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    setSettings({
      appName: values.appName,
      logoUrl: preview || '',
    });
    toast({ title: "Configurações salvas!", description: "Suas alterações foram salvas com sucesso." });
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
                name="logo"
                render={() => (
                  <FormItem>
                    <FormLabel>Logo da Empresa</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">
                                {preview ? (
                                    <Image src={preview} alt="Pré-visualização do logo" width={96} height={96} className="object-contain rounded-md" />
                                ) : (
                                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                            <Button type="button" variant="outline" asChild>
                                <label htmlFor="logo-upload">
                                    {preview ? "Trocar Logo" : "Enviar Logo"}
                                </label>
                            </Button>
                             {preview && <Button type="button" variant="ghost" onClick={() => setPreview(null)}>Remover</Button>}
                        </div>
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
    </div>
  );
}
