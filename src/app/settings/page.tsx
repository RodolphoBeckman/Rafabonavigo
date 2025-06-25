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
import type { AppSettings } from '@/lib/types';
import { Settings } from 'lucide-react';
import Image from 'next/image';

const settingsSchema = z.object({
  appName: z.string().min(1, { message: 'O nome do aplicativo é obrigatório.' }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', { appName: 'StockPilot' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.setValue('appName', settings.appName);
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
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    setSettings({
      ...settings,
      appName: values.appName,
      logoUrl: logoPreview || undefined,
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

              <FormItem>
                <FormLabel>Logo do Aplicativo</FormLabel>
                {logoPreview && (
                  <div className="mt-2 flex items-center gap-4">
                    <Image src={logoPreview} alt="Pré-visualização da logo" width={40} height={40} className="rounded-md object-contain" />
                     <Button type="button" variant="outline" size="sm" onClick={() => setLogoPreview(null)}>Remover Logo</Button>
                  </div>
                )}
                <FormControl>
                  <Input type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleLogoChange} className="pt-1.5"/>
                </FormControl>
                <FormMessage />
              </FormItem>
              
              <Button type="submit" className="w-full">Salvar Alterações</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
