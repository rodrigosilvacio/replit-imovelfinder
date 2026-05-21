import { useState } from "react";
import { useListFontes, useCreateFonte, useUpdateFonte, useDeleteFonte, useIniciarScraping, useGetScrapingStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Play, Trash2, Plus, Database, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Fontes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: fontes, isLoading } = useListFontes();
  const { data: scrapingStatus } = useGetScrapingStatus({ query: { refetchInterval: 5000 } });
  
  const createFonte = useCreateFonte();
  const updateFonte = useUpdateFonte();
  const deleteFonte = useDeleteFonte();
  const iniciarScraping = useIniciarScraping();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFonte, setNewFonte] = useState({ nome: "", url: "", descricao: "" });

  const handleCreate = () => {
    if (!newFonte.nome || !newFonte.url) {
      toast({ title: "Erro", description: "Nome e URL são obrigatórios", variant: "destructive" });
      return;
    }
    createFonte.mutate({ data: newFonte }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewFonte({ nome: "", url: "", descricao: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/fontes"] });
        toast({ title: "Sucesso", description: "Fonte adicionada com sucesso." });
      }
    });
  };

  const handleToggleActive = (id: number, ativa: boolean) => {
    updateFonte.mutate({ id, data: { ativa } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/fontes"] })
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta fonte?")) {
      deleteFonte.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/fontes"] });
          toast({ title: "Sucesso", description: "Fonte removida." });
        }
      });
    }
  };

  const handleScrape = (fonteId?: number) => {
    iniciarScraping.mutate({ data: { fonteId: fonteId || null } }, {
      onSuccess: () => {
        toast({ title: "Scraping Iniciado", description: "O processo de coleta começou em background." });
        queryClient.invalidateQueries({ queryKey: ["/api/scraping/status"] });
      },
      onError: (err: any) => {
        toast({ title: "Erro", description: err.message || "Erro ao iniciar scraping", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fontes de Dados</h1>
          <p className="text-muted-foreground mt-1">Gerencie os sites imobiliários monitorados pelo radar.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-black/20 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => handleScrape()}
            disabled={scrapingStatus?.rodando}
          >
            {scrapingStatus?.rodando ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {scrapingStatus?.rodando ? "Scraping em Andamento..." : "Scraping Geral"}
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fonte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Fonte</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome do Site/Portal</label>
                  <Input 
                    value={newFonte.nome} 
                    onChange={e => setNewFonte({...newFonte, nome: e.target.value})}
                    placeholder="Ex: Zap Imóveis SP" 
                    className="bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">URL Base / Busca</label>
                  <Input 
                    value={newFonte.url} 
                    onChange={e => setNewFonte({...newFonte, url: e.target.value})}
                    placeholder="https://..." 
                    className="bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Descrição (Opcional)</label>
                  <Input 
                    value={newFonte.descricao} 
                    onChange={e => setNewFonte({...newFonte, descricao: e.target.value})}
                    placeholder="Filtros aplicados na URL..." 
                    className="bg-black/20"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createFonte.isPending}>
                Salvar Fonte
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {scrapingStatus?.rodando && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-4">
          <RefreshCw className="w-5 h-5 text-accent animate-spin shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-accent">Scraping em Andamento</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Fonte atual: <span className="text-foreground">{scrapingStatus.fonteAtual || "Iniciando..."}</span>
            </p>
            <div className="flex gap-4 mt-2 text-xs font-mono-numbers">
              <span className="text-primary">Coletados: {scrapingStatus.imoveisColetados}</span>
              {scrapingStatus.erros ? <span className="text-destructive">Erros: {scrapingStatus.erros}</span> : null}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Carregando fontes...</div>
      ) : fontes?.length === 0 ? (
        <div className="text-center p-12 bg-card/30 rounded-lg border border-border/50 border-dashed">
          <Database className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma fonte configurada. Adicione sites para monitorar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fontes?.map((fonte) => (
            <Card key={fonte.id} className="glass-panel flex flex-col group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold line-clamp-1">{fonte.nome}</CardTitle>
                  <Switch 
                    checked={fonte.ativa} 
                    onCheckedChange={(c) => handleToggleActive(fonte.id, c)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <CardDescription className="text-xs font-mono break-all line-clamp-1 mt-1">
                  <a href={fonte.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary transition-colors">
                    {fonte.url}
                  </a>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col pt-0">
                {fonte.descricao && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{fonte.descricao}</p>
                )}
                
                <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground flex items-center mb-1"><Clock className="w-3 h-3 mr-1"/> Último Run</span>
                    <span className="font-mono-numbers text-foreground">
                      {fonte.ultimoScraping ? format(new Date(fonte.ultimoScraping), "dd/MM HH:mm") : "Nunca"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground flex items-center mb-1"><Database className="w-3 h-3 mr-1"/> Coletados</span>
                    <span className="font-mono-numbers text-foreground">
                      {fonte.totalImoveisColetados || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                  <Button 
                    variant="secondary" 
                    className="flex-1 bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors" 
                    size="sm"
                    disabled={!fonte.ativa || scrapingStatus?.rodando}
                    onClick={() => handleScrape(fonte.id)}
                  >
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Rodar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="shrink-0 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(fonte.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}