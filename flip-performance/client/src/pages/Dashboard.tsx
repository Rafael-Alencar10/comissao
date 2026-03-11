import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { Users, PhoneCall, MessageCircle, DollarSign, TrendingUp, BarChart3, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { verificarElegibilidade, calcularMediaAtendimentosTurno, calcularPerformance, calcularBonificacao } from "@/lib/elegibilidade";

export default function Dashboard() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const producaoQuery = trpc.producao.getByMesAno.useQuery({ mes, ano });
  const atendentesQuery = trpc.atendentes.list.useQuery();

  const producoes = producaoQuery.data || [];
  const atendentes = atendentesQuery.data || [];

  const producoesComElegibilidade = useMemo(() => {
    return producoes.map((producao) => {
      const atendente = atendentes.find((a) => a.id === producao.atendenteId);

      // CORRIGIDO: usa calcularPerformance centralizado
      const performanceRecalc = calcularPerformance(producao);
      const totalAtendimentos = producao.chatTotal + producao.ligacaoTotal;

      // CORRIGIDO: média de ATENDIMENTOS do turno (não de performance)
      const producoesDoTurno = producoes.filter((p) => {
        const att = atendentes.find((a) => a.id === p.atendenteId);
        return att?.turno === atendente?.turno;
      });

      const mediaAtendimentosTurno = calcularMediaAtendimentosTurno(
        producoesDoTurno.map((p) => ({ chatTotal: p.chatTotal, ligacaoTotal: p.ligacaoTotal }))
      );

      // CORRIGIDO: 4 parâmetros — inclui tolerância do atendente
      const { elegivel: elegivelRecalc } = verificarElegibilidade(
        performanceRecalc,
        totalAtendimentos,
        mediaAtendimentosTurno,
        atendente?.tolerancia || 0
      );

      return {
        ...producao,
        elegivelRecalc: elegivelRecalc ? 1 : 0,
        // CORRIGIDO: recalcula bonificação — não usa o valor antigo do banco
        bonificacao: (elegivelRecalc ? calcularBonificacao(performanceRecalc) : 0).toString(),
      };
    });
  }, [producoes, atendentes]);

  const totalChatAtendimentos = producoesComElegibilidade.reduce((sum, p) => sum + p.chatTotal, 0);
  const totalLigacaoAtendimentos = producoesComElegibilidade.reduce((sum, p) => sum + p.ligacaoTotal, 0);
  const totalBonificacao = producoesComElegibilidade.reduce((sum, p) => sum + parseFloat(p.bonificacao), 0);
  const mediaAtendimentos = atendentes.length > 0 ? (totalChatAtendimentos + totalLigacaoAtendimentos) / atendentes.length : 0;

  const turnoData = ["A", "B", "C"].map((turno) => {
    const turnoProducoes = producoesComElegibilidade.filter((p) => {
      const atendente = atendentes.find((a) => a.id === p.atendenteId);
      return atendente?.turno === turno;
    });
    return {
      turno,
      chat: turnoProducoes.reduce((sum, p) => sum + p.chatTotal, 0),
      ligacao: turnoProducoes.reduce((sum, p) => sum + p.ligacaoTotal, 0),
      bonificacao: turnoProducoes.reduce((sum, p) => sum + parseFloat(p.bonificacao), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do desempenho da equipe</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <CardTitle className="text-xs font-medium text-muted-foreground">Atendimentos Chat</CardTitle>
              <div className="text-3xl font-bold text-foreground mt-2">{totalChatAtendimentos}</div>
              <p className="text-xs text-muted-foreground mt-1">Total do período</p>
            </div>
            <div className="bg-popover p-3 rounded-lg flex-shrink-0"><MessageCircle className="h-6 w-6 text-primary" /></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <CardTitle className="text-xs font-medium text-[#94A3B8]">Atendimentos Ligação</CardTitle>
              <div className="text-3xl font-bold text-white mt-2">{totalLigacaoAtendimentos}</div>
              <p className="text-xs text-[#94A3B8] mt-1">Total do período</p>
            </div>
            <div className="bg-card p-3 rounded-lg flex-shrink-0"><PhoneCall className="h-6 w-6 text-[#4A90E2]" /></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <CardTitle className="text-xs font-medium text-muted-foreground">Média por Colaborador</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <div className="text-3xl font-bold text-foreground">{mediaAtendimentos.toFixed(1)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Atendimentos/pessoa</p>
            </div>
            <div className="bg-popover p-3 rounded-lg flex-shrink-0"><Users className="h-6 w-6 text-primary" /></div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total em Bônus</CardTitle>
              <div className="flex items-baseline gap-1 mt-2">
                <div className="text-3xl font-bold text-foreground">R$ {totalBonificacao.toFixed(2)}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">A pagar</p>
            </div>
            <div className="bg-popover p-3 rounded-lg flex-shrink-0"><DollarSign className="h-6 w-6 text-primary" /></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Evolução de Atendimentos</CardTitle>
              <CardDescription>Comparação por turno</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={turnoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="turno" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(20, 20, 40, 0.9)", border: "1px solid rgba(255,255,255,0.2)" }} />
                <Legend />
                <Line type="monotone" dataKey="chat" stroke="rgb(43, 108, 255)" name="Chat" strokeWidth={2} />
                <Line type="monotone" dataKey="ligacao" stroke="rgb(59, 130, 246)" name="Ligação" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Performance por Turno</CardTitle>
              <CardDescription>Desempenho por equipe</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="turno" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(20, 20, 40, 0.9)", border: "1px solid rgba(255,255,255,0.2)" }} />
                <Bar dataKey="chat" fill="rgb(43, 108, 255)" name="Chat" />
                <Bar dataKey="ligacao" fill="rgb(59, 130, 246)" name="Ligação" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Resumo do Período</CardTitle>
          <Calendar className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Atendentes Ativos</p>
                <p className="text-2xl font-bold text-foreground">{atendentes.filter((a: any) => a.status === "Ativo").length}</p>
              </div>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted/50 p-4 rounded-lg flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lançamentos no Mês</p>
                <p className="text-2xl font-bold text-foreground">{producoes.length}</p>
              </div>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            {/* CORRIGIDO: usa elegivelRecalc (lógica correta) em vez de p.elegivel (dado do banco com lógica antiga) */}
            <div className="bg-muted/50 p-4 rounded-lg flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Elegíveis à Bônus</p>
                <p className="text-2xl font-bold text-emerald-400">{producoesComElegibilidade.filter((p) => p.elegivelRecalc === 1).length}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="bg-muted/50 p-4 rounded-lg flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Não Elegíveis</p>
                <p className="text-2xl font-bold text-red-400">{producoesComElegibilidade.filter((p) => p.elegivelRecalc === 0).length}</p>
              </div>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
