import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetScrapingStatus } from "@workspace/api-client-react";
import { Activity, LayoutDashboard, Search, FileText, Database, Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const { data: scrapingStatus } = useGetScrapingStatus({
    query: {
      refetchInterval: 5000,
    }
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/imoveis", label: "Radar de Imóveis", icon: Search },
    { href: "/relatorio", label: "Relatório de Oportunidades", icon: FileText },
    { href: "/fontes", label: "Fontes de Dados", icon: Database },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-sidebar shrink-0 z-10 relative">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <HomeIcon className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">Monitor<span className="text-primary">Casas</span></span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all group cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 mr-3 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="p-4 border-t border-border bg-black/20">
          <div className="flex items-center text-xs font-medium text-muted-foreground mb-2">
            <Activity className="w-4 h-4 mr-2" />
            System Status
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              scrapingStatus?.rodando ? "bg-accent animate-pulse" : "bg-primary"
            )} />
            <span className="text-sm font-mono-numbers">
              {scrapingStatus?.rodando ? "Scraping Active" : "Idle"}
            </span>
          </div>
          {scrapingStatus?.rodando && (
            <div className="mt-2 text-xs text-muted-foreground">
              Coletados: <span className="text-foreground">{scrapingStatus.imoveisColetados}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Subtle grid background for cockpit feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        
        <div className="flex-1 overflow-y-auto p-8 z-10 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}