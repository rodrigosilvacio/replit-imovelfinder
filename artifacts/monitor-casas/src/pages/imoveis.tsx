import { useState } from "react";
import { useListImoveis } from "@workspace/api-client-react";
import { ImovelCard } from "@/components/imovel-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { ListImoveisTipo, ListImoveisOrdenar } from "@workspace/api-client-react";

export default function Imoveis() {
  const [pagina, setPagina] = useState(1);
  const [tipo, setTipo] = useState<ListImoveisTipo>("todos");
  const [ordenar, setOrdenar] = useState<ListImoveisOrdenar>("preco_asc");
  const [cidade, setCidade] = useState("");
  const [apenasAbaixoMedia, setApenasAbaixoMedia] = useState(false);
  const [apenasFavoritos, setApenasFavoritos] = useState(false);

  // Debounced search for cidade
  const [cidadeInput, setCidadeInput] = useState("");
  
  const handleSearch = () => {
    setCidade(cidadeInput);
    setPagina(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const { data, isLoading } = useListImoveis({
    pagina,
    porPagina: 12,
    tipo: tipo !== "todos" ? tipo : undefined,
    ordenar,
    cidade: cidade || undefined,
    apenasAbaixoMedia: apenasAbaixoMedia || undefined,
    apenasFavoritos: apenasFavoritos || undefined,
  }, {
    query: { keepPreviousData: true }
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Radar de Imóveis</h1>
        <p className="text-muted-foreground mt-1">Busque, filtre e analise oportunidades do mercado.</p>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel rounded-lg p-4 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between sticky top-0 z-20">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrar por cidade..." 
              className="pl-9 bg-black/20 border-border/50 focus-visible:ring-primary"
              value={cidadeInput}
              onChange={(e) => setCidadeInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <Select value={tipo} onValueChange={(v) => { setTipo(v as ListImoveisTipo); setPagina(1); }}>
            <SelectTrigger className="w-[140px] bg-black/20 border-border/50">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ordenar} onValueChange={(v) => { setOrdenar(v as ListImoveisOrdenar); setPagina(1); }}>
            <SelectTrigger className="w-[180px] bg-black/20 border-border/50">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preco_asc">Menor Preço</SelectItem>
              <SelectItem value="preco_desc">Maior Preço</SelectItem>
              <SelectItem value="preco_m2_asc">Menor Preço/m²</SelectItem>
              <SelectItem value="data_desc">Mais Recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <Switch 
              id="abaixo-media" 
              checked={apenasAbaixoMedia}
              onCheckedChange={(c) => { setApenasAbaixoMedia(c); setPagina(1); }}
            />
            <Label htmlFor="abaixo-media" className="text-primary font-medium cursor-pointer">Abaixo da Média</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="favoritos" 
              checked={apenasFavoritos}
              onCheckedChange={(c) => { setApenasFavoritos(c); setPagina(1); }}
            />
            <Label htmlFor="favoritos" className="text-accent font-medium cursor-pointer">Favoritos</Label>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-96 w-full" />)}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card/30 rounded-lg border border-border/50 border-dashed">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>Nenhum imóvel encontrado com os filtros atuais.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4 font-mono-numbers">
              Mostrando {data?.items.length} de {data?.total} imóveis
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.items.map((imovel) => (
                <ImovelCard key={imovel.id} imovel={imovel} />
              ))}
            </div>
            
            {/* Pagination */}
            {data && data.totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={pagina === 1}
                  onClick={() => setPagina(p => p - 1)}
                  className="bg-black/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="font-mono-numbers text-sm font-medium">
                  {pagina} / {data.totalPaginas}
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={pagina >= data.totalPaginas}
                  onClick={() => setPagina(p => p + 1)}
                  className="bg-black/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}