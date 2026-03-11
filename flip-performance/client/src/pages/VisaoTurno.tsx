import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, MessageCircle, PhoneCall, TrendingUp, Calendar } from "lucide-react";
import { verificarElegibilidade, calcularMediaAtendimentosTurno, calcularPerformance, calcularBonificacao } from "@/lib/elegibilidade";

export default function VisaoTurno() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [turnoAtivo, setTurnoAtivo] = useState("A");

  const producaoQuery = trpc.producao.getByMesAno.useQuery({ mes, ano });
  const atendentesQuery = trpc.atendentes.list.useQuery();

  const producoes = producaoQuery.data || [];
  const atendentes = atendentesQuery.data || [];

  const atendentesDoTurno = atendentes.filter((a) => a.turno === turnoAtivo && a.status === "Ativo");
  const producoesDoTurno = producoes.filter((p) => {
    const atendente = atendentes.find((a) => a.id === p.atendenteId);
    return atendente?.turno === turnoAtivo;
  });

  // CORRIGIDO: média de ATENDIMENTOS do turno (não de performance)
  const mediaAtendimentosTurno = calcularMediaAtendimentosTurno(
    producoesDoTurno.map((p) => ({ chatTotal: p.chatTotal, ligacaoTotal: p.ligacaoTotal }))
  );

  const elegiveisCount = producoesDoTurno.filter((p) => p.elegivel === 1).length;

  const atendentesComProducao = atendentesDoTurno.map((atendente) => {
    const producao = producoesDoTurno.find((p) => p.atendenteId === atendente.id);
    const totalAtend = (producao?.chatTotal || 0) + (producao?.ligacaoTotal || 0);

    let performance = 0;
    let elegivel = false;

    if (producao) {
      // CORRIGIDO: usa calcularPerformance centralizado
      performance = calcularPerformance(producao);

      // CORRIGIDO: 4 parâmetros — inclui tolerância do atendente
      const { elegivel: elegivelResult } = verificarElegibilidade(
        performance,
        totalAtend,
        mediaAtendimentosTurno,
        atendente.tolerancia || 0
      );
      elegivel = elegivelResult;
    }

    return {
      ...atendente,
      chatTotal: producao?.chatTotal || 0,
      ligacaoTotal: producao?.ligacaoTotal || 0,
      totalAtendimentos: totalAtend,
      performance,
      elegivel,
      bonificacao: (elegivel ? calcularBonificacao(performance) : 0).toString(),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão por Turno</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe o desempenho de cada equipe</p>
        </div>
        <div className="bg-card border border-border rounded-lg flex items-center gap-4 p-3">
          <Calendar className="h-5 w-5 text-[#94A3B8] flex-shrink-0" />
          <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
            <SelectTrigger className="w-40 bg-popover border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(ano, m - 1).toLocaleDateString("pt-BR", { month: "long" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
            <SelectTrigger className="w-24 bg-popover border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((a) => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="space-y-4 p-6">
          <div className="flex gap-2 bg-card p-1 rounded-full w-fit">
            {["A", "B", "C"].map((turno) => (
              <button
                key={turno}
                onClick={() => setTurnoAtivo(turno)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${turnoAtivo === turno ? "bg-[#2B6CFF] text-white" : "text-[#94A3B8] hover:text-white"
                  }`}
              >
                Turno {turno}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="bg-[#131A2F]/40 border border-[#2B6CFF]/30 h-24 flex items-center">
              <CardContent className="flex items-center gap-4 p-4 w-full">
                <div className="bg-[#1E293B] p-2 rounded-lg flex-shrink-0">
                  <Users className="h-6 w-6 text-[#60A5FA]" />
                </div>
                <div className="flex flex-col justify-center">
                  <CardTitle className="text-xs font-semibold text-[#94A3B8] uppercase">Atendentes Ativos</CardTitle>
                  <div className="text-3xl font-bold text-white">{atendentesDoTurno.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border h-24 flex items-center">
              <CardContent className="flex items-center gap-4 p-4 w-full">
                <div className="bg-card p-2 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-[#60A5FA]" />
                </div>
                <div className="flex flex-col justify-center">
                  <CardTitle className="text-xs font-semibold text-[#94A3B8] uppercase">Média do Turno</CardTitle>
                  <div className="flex items-baseline gap-1">
                    {/* CORRIGIDO: exibe média de atendimentos */}
                    <div className="text-3xl font-bold text-white">{mediaAtendimentosTurno.toFixed(0)}</div>
                    <p className="text-sm text-[#94A3B8]">atendimentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#131A2F]/40 border border-[#2B6CFF]/30 h-24 flex items-center">
              <CardContent className="flex items-center gap-4 p-4 w-full">
                <div className="bg-[#1E293B] p-2 rounded-lg flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-[#60A5FA]" />
                </div>
                <div className="flex flex-col justify-center">
                  <CardTitle className="text-xs font-semibold text-[#94A3B8] uppercase">Elegíveis à Bônus</CardTitle>
                  <div className="text-3xl font-bold text-white">{elegiveisCount}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atendentesComProducao.map((atendente) => (
              <Card key={atendente.id} className="bg-card border-[#1E293B] border overflow-hidden">
                <CardHeader className="pb-2 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{atendente.nome?.toUpperCase()}</CardTitle>
                      <p className="text-xs text-muted-foreground">{atendente.tipoAtuacao}</p>
                    </div>
                    <Badge className={atendente.elegivel ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[rgba(239,68,68,0.1)] text-[#f87171] hover:bg-[rgba(239,68,68,0.2)]"}>
                      {atendente.elegivel ? "Elegível" : "Não Elegível"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5">
                        <MessageCircle className="h-2.5 w-2.5 text-blue-400" />
                        <span className="text-xs text-muted-foreground">Chat</span>
                      </div>
                      <p className="text-sm font-bold">{atendente.chatTotal}</p>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-0.5">
                        <PhoneCall className="h-2.5 w-2.5 text-emerald-400" />
                        <span className="text-xs text-muted-foreground">Ligação</span>
                      </div>
                      <p className="text-sm font-bold">{atendente.ligacaoTotal}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Performance</span>
                      <span className={`text-xs font-bold ${atendente.elegivel ? "text-emerald-400" : "text-orange-400"}`}>
                        {atendente.performance.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${atendente.elegivel ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(atendente.performance, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* CORRIGIDO: exibe total de atendimentos vs mínimo exigido */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Atendimentos: <strong className="text-foreground">{atendente.totalAtendimentos}</strong></span>
                    <span>Mínimo: <strong className="text-foreground">{Math.ceil(mediaAtendimentosTurno)}</strong></span>
                  </div>

                  {atendente.elegivel && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Bonificação</p>
                      <p className="text-sm font-bold text-emerald-400">R$ {parseFloat(atendente.bonificacao).toFixed(2)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {atendentesComProducao.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Nenhum atendente ativo neste turno</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
