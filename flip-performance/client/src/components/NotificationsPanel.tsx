import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertCircle, CheckCircle, TrendingDown, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationsPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const notificacoesQuery = trpc.notificacoes.getNaoLidas.useQuery(
    { atendenteId: user?.id || 0 },
    { enabled: !!user }
  );

  const marcarComoLidaMutation = trpc.notificacoes.marcarComoLida.useMutation();

  const notificacoes = notificacoesQuery.data || [];

  const handleMarcarComoLida = async (id: number) => {
    await marcarComoLidaMutation.mutateAsync({ id });
    notificacoesQuery.refetch();
  };

  const getIconByTipo = (tipo: string) => {
    switch (tipo) {
      case "desempenho_baixo":
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      case "elegibilidade_alterada":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case "meta_atingida":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-blue-400" />;
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "desempenho_baixo":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "elegibilidade_alterada":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "meta_atingida":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {notificacoes.length > 0 && (
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 bg-card/80 backdrop-blur-sm border-border/50 shadow-lg z-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Notificações</CardTitle>
              <CardDescription>
                {notificacoes.length} {notificacoes.length === 1 ? "notificação" : "notificações"} não lida
                {notificacoes.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent>
            {notificacoes.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-2 pr-4">
                  {notificacoes.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 mt-1">
                          {getIconByTipo(notificacao.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {notificacao.titulo}
                            </p>
                            <Badge className={`text-xs flex-shrink-0 ${getBadgeColor(notificacao.tipo)}`}>
                              {notificacao.tipo === "desempenho_baixo" && "Desempenho"}
                              {notificacao.tipo === "elegibilidade_alterada" && "Elegibilidade"}
                              {notificacao.tipo === "meta_atingida" && "Meta"}
                              {notificacao.tipo === "alerta_geral" && "Alerta"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notificacao.mensagem}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notificacao.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarComoLida(notificacao.id)}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
