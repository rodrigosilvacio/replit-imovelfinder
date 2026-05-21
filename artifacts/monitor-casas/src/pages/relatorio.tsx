import { useState } from "react";
import { useGerarRelatorio, GerarRelatorioTipo } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ImovelCard } from "@/components/imovel-card";
import { FileText, Download, Printer, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Relatorio() {
  const [tipo, setTipo] = useState<GerarRelatorioTipo>("todos");
  const [cidade, setCidade] = useState("");
  const [limite, setLimite] = useState("10");

  const [queryParams, setQueryParams] = useState<{ tipo?: GerarRelatorioTipo; cidade?: string; limite?: number }>({
    tipo: "todos",
    limite: 10
  });

  const { data, isLoading, isFetching } = useGerarRelatorio(queryParams, {
    query: {
      enabled: true,
      refetchOnWindowFocus: false,
    }
  });

  const handleGerar = () => {
    setQueryParams({
      tipo: tipo !== "todos" ? tipo : undefined,
      cidade: cidade || undefined,
      limite: parseInt(limite) || 10
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return '---';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Ranking algorítmico das melhores ofertas do mercado.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="bg-black/20" onClick={handlePrint} disabled={!data}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Config Panel - Hidden when printing */}
      <Card className="glass-panel print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Tipo</label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as GerarRelatorioTipo)}>
              <SelectTrigger className="bg-black/20 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="compra">Compra</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">Cidade (Opcional)</label>
            <Input 
              value={cidade} 
              onChange={e => setCidade(e.target.value)} 
              placeholder="Ex: São Paulo" 
              className="bg-black/20 border-border/50"
            />
          </div>
          <div className="space-y-2 w-24">
            <label className="text-xs font-medium text-muted-foreground uppercase">Top N</label>
            <Input 
              type="number" 
              value={limite} 
              onChange={e => setLimite(e.target.value)} 
              min="1" max="50"
              className="bg-black/20 border-border/50 font-mono-numbers"
            />
          </div>
          <Button onClick={handleGerar} disabled={isFetching} className="w-full md:w-auto">
            {isFetching ? "Processando..." : "Gerar Relatório"}
          </Button>
        </CardContent>
      </Card>

      {/* Report Content */}
      {isLoading || isFetching ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Processando dados e calculando pontuações...
        </div>
      ) : data ? (
        <div className="space-y-8 bg-card rounded-xl p-8 border border-border/50 print:p-0 print:border-none print:bg-transparent">
          {/* Header for print */}
          <div className="border-b border-border/50 pb-6 mb-6">
            <h2 className="text-2xl font-bold mb-2">Relatório Executivo de Oportunidades Imobiliárias</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <div><span className="font-medium text-foreground">Gerado em:</span> {format(new Date(data.geradoEm), "dd/MM/yyyy HH:mm")}</div>
              <div><span className="font-medium text-foreground">Imóveis analisados:</span> <span className="font-mono-numbers">{data.totalAnalisados}</span></div>
              {data.mediaGeralCompra && <div><span className="font-medium text-foreground">Ticket Médio (Compra):</span> <span className="font-mono-numbers">{formatCurrency(data.mediaGeralCompra)}</span></div>}
            </div>
          </div>

          {data.melhoresOportunidades.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              Não foram encontradas oportunidades com os critérios informados.
            </div>
          ) : (
            <div className="space-y-12">
              {data.melhoresOportunidades.map((op, index) => (
                <div key={op.imovel.id} className="flex flex-col md:flex-row gap-6 relative">
                  <div className="hidden md:flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg border border-primary/30">
                      #{index + 1}
                    </div>
                    {index !== data.melhoresOportunidades.length - 1 && (
                      <div className="w-px h-full bg-border/50 my-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="md:hidden inline-flex items-center bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/30 mb-2 w-fit">
                      #{index + 1} Ranking
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3 items-start">
                      <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-primary mb-1">Motivo do Destaque (Score: <span className="font-mono-numbers">{op.pontuacao.toFixed(1)}</span>)</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{op.motivo}</p>
                      </div>
                    </div>
                    
                    <div className="max-w-xl">
                      <ImovelCard imovel={op.imovel} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}