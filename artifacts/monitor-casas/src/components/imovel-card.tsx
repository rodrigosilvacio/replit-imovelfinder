import { Card } from "@/components/ui/card";
import { Imovel } from "@workspace/api-client-react";
import { MapPin, BedDouble, Bath, Maximize, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleFavorito } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListImoveisQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ImovelCardProps {
  imovel: Imovel;
}

export function ImovelCard({ imovel }: ImovelCardProps) {
  const queryClient = useQueryClient();
  const toggleFavorito = useToggleFavorito();

  const handleToggleFavorito = () => {
    toggleFavorito.mutate(
      { id: imovel.id, data: { favorito: !imovel.favorito } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListImoveisQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        }
      }
    );
  };

  // PostgreSQL numeric fields arrive as strings — parse safely
  const toNum = (v: unknown): number => {
    const n = parseFloat(String(v ?? "0"));
    return isNaN(n) ? 0 : n;
  };

  const formatCurrency = (value: unknown) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNum(value));
  };

  return (
    <Card className={cn(
      "group overflow-hidden relative flex flex-col bg-card/50 backdrop-blur-sm border-border/50 transition-all hover:border-border hover:shadow-lg",
      imovel.abaixoDaMedia && "pulse-border"
    )}>
      {/* Image Header */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {imovel.imagemUrl ? (
          <img 
            src={imovel.imagemUrl} 
            alt={imovel.titulo} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/a1a1aa?text=Sem+Foto';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
            <span className="text-xs uppercase tracking-widest font-mono">No Image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {imovel.abaixoDaMedia && imovel.percentualAbaixoMedia && (
            <div className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-sm backdrop-blur-md">
              {toNum(imovel.percentualAbaixoMedia).toFixed(0)}% ABAIXO DA MÉDIA
            </div>
          )}
          <div className="bg-black/60 text-white text-xs font-mono px-2 py-1 rounded backdrop-blur-md w-fit">
            {imovel.tipo.toUpperCase()}
          </div>
        </div>

        {/* Favorite Button */}
        <button 
          onClick={handleToggleFavorito}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-md transition-colors z-10"
        >
          <Heart className={cn("w-5 h-5 transition-colors", imovel.favorito ? "fill-accent text-accent" : "")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
            {imovel.titulo}
          </h3>
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm mb-4 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span className="truncate">{imovel.bairro}{imovel.cidade ? `, ${imovel.cidade}` : ''}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-mono-numbers text-muted-foreground bg-black/20 rounded-md p-2">
          <div className="flex flex-col items-center justify-center p-1">
            <BedDouble className="w-4 h-4 mb-1 opacity-70" />
            <span>{imovel.quartos || '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1 border-x border-border/50">
            <Bath className="w-4 h-4 mb-1 opacity-70" />
            <span>{imovel.banheiros || '-'}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1">
            <Maximize className="w-4 h-4 mb-1 opacity-70" />
            <span>{imovel.area ? `${imovel.area}m²` : '-'}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Preço</span>
            <span className="text-xl font-bold font-mono-numbers text-foreground">
              {formatCurrency(imovel.preco)}
            </span>
            {imovel.precoM2 && (
              <span className="text-[10px] text-muted-foreground font-mono-numbers">{formatCurrency(imovel.precoM2)}/m²</span>
            )}
          </div>
          
          <Button size="icon" variant="secondary" className="rounded-full bg-secondary/80 hover:bg-primary hover:text-primary-foreground" asChild>
            <a href={imovel.urlOriginal} target="_blank" rel="noopener noreferrer" title="Ver original">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}