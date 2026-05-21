import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImovelCard } from "@/components/imovel-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Home, Heart, Map } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="mt-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-96" />)}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number | null) => {
    if (!val) return '---';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do mercado. Última atualização: {dashboard.ultimaAtualizacao ? format(new Date(dashboard.ultimaAtualizacao), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Nunca'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Imóveis Monitorados</CardTitle>
            <Home className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-numbers text-foreground">{dashboard.totalImoveis}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary uppercase tracking-wider">Abaixo da Média</CardTitle>
            <TrendingDown className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-numbers text-primary">{dashboard.imoveisAbaixoMedia}</div>
            <p className="text-xs text-primary/80 mt-1 font-mono-numbers">{(dashboard.imoveisAbaixoMedia / Math.max(dashboard.totalImoveis, 1) * 100).toFixed(1)}% do total</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Média Compra</CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-numbers text-foreground">{formatCurrency(dashboard.mediaPrecoCompra)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Favoritos</CardTitle>
            <Heart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono-numbers text-foreground">{dashboard.totalFavoritos}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Oportunidades em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard.imoveisDestaque.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-muted-foreground bg-card/30 rounded-lg border border-border/50">
                Nenhuma oportunidade extrema encontrada no momento.
              </div>
            ) : (
              dashboard.imoveisDestaque.map(imovel => (
                <ImovelCard key={imovel.id} imovel={imovel} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Distribuição por Cidades</h2>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {dashboard.distribuicaoCidades.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center">
                      <Map className="w-4 h-4 text-muted-foreground mr-3" />
                      <span className="font-medium text-sm">{item.cidade}</span>
                    </div>
                    <span className="font-mono-numbers text-sm text-muted-foreground bg-black/20 px-2 py-1 rounded">
                      {item.total}
                    </span>
                  </div>
                ))}
                {dashboard.distribuicaoCidades.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Sem dados de cidades
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}