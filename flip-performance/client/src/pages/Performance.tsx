import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { TrendingUp, CheckCircle, Trophy, Medal, Calendar } from "lucide-react";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import {
  verificarElegibilidade,
  calcularMediaAtendimentosTurno,
  calcularPerformance,
  calcularBonificacao,
} from "@/lib/elegibilidade";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";

export default function Performance() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTurno, setSelectedTurno] = useState("all");

  const { data: attendentes = [] } = trpc.atendentes.list.useQuery();
  const { data: producoes = [] } = trpc.producao.getByMesAno.useQuery({ mes: selectedMonth, ano: selectedYear });
  const { data: todasProducoes = [] } = trpc.producao.getByMesAno.useQuery({ mes: selectedMonth, ano: selectedYear });

  const performanceData = useMemo(() => {
    return attendentes
      .filter((a) => selectedTurno === "all" || a.turno === selectedTurno)
      .map((atendente) => {
        const producaoAtendente = producoes.filter((p) => p.atendenteId === atendente.id);

        if (producaoAtendente.length === 0) {
          return {
            atendente,
            chatTotal: 0,
            ligacaoTotal: 0,
            pontosTotais: 0,
            maxPontos: 0,
            performance: 0,
            atendimentosTotais: 0,
            mediaAtendimentosTurno: 0,
            elegivel: false,
            motivo: "Sem registros de produção",
            bonificacao: 0,
          };
        }

        const totalChat = producaoAtendente.reduce((sum, p) => sum + p.chatTotal, 0);
        const totalLigacao = producaoAtendente.reduce((sum, p) => sum + p.ligacaoTotal, 0);
        const totalAtendimentos = totalChat + totalLigacao;

        // CORRIGIDO: usa calcularPerformance centralizado
        // Para múltiplas produções, agrega os dados e calcula uma vez
        const dadosAgregados = {
          chatTotal: totalChat,
          ligacaoTotal: totalLigacao,
          chatNota5: producaoAtendente.reduce((s, p) => s + p.chatNota5, 0),
          chatNota4: producaoAtendente.reduce((s, p) => s + p.chatNota4, 0),
          chatNota3: producaoAtendente.reduce((s, p) => s + p.chatNota3, 0),
          chatNota2: producaoAtendente.reduce((s, p) => s + p.chatNota2, 0),
          chatNota1: producaoAtendente.reduce((s, p) => s + p.chatNota1, 0),
          ligacaoExtrementeSatisfeito: producaoAtendente.reduce((s, p) => s + p.ligacaoExtrementeSatisfeito, 0),
          ligacaoExcelente: producaoAtendente.reduce((s, p) => s + p.ligacaoExcelente, 0),
          ligacaoBom: producaoAtendente.reduce((s, p) => s + p.ligacaoBom, 0),
          ligacaoRegular: producaoAtendente.reduce((s, p) => s + p.ligacaoRegular, 0),
          ligacaoRuim: producaoAtendente.reduce((s, p) => s + p.ligacaoRuim, 0),
          ligacaoPessimo: producaoAtendente.reduce((s, p) => s + p.ligacaoPessimo, 0),
        };

        const performance = calcularPerformance(dadosAgregados);

        const totalChatRatings = dadosAgregados.chatNota5 + dadosAgregados.chatNota4 + dadosAgregados.chatNota3 + dadosAgregados.chatNota2 + dadosAgregados.chatNota1;
        const totalLigacaoRatings = dadosAgregados.ligacaoExtrementeSatisfeito + dadosAgregados.ligacaoExcelente + dadosAgregados.ligacaoBom + dadosAgregados.ligacaoRegular + dadosAgregados.ligacaoRuim + dadosAgregados.ligacaoPessimo;
        const maxPontos = (totalChatRatings + totalLigacaoRatings) * 5;
        const pontosTotais = producaoAtendente.reduce((s, p) => s + parseFloat(p.pontosTotais as any || "0"), 0);

        // CORRIGIDO: média de ATENDIMENTOS do turno (não de performance)
        const producoesTurno = producoes.filter((p) => {
          const att = attendentes.find((a) => a.id === p.atendenteId);
          return att?.turno === atendente.turno;
        });

        const mediaAtendimentosTurno = calcularMediaAtendimentosTurno(
          producoesTurno.map((p) => ({ chatTotal: p.chatTotal, ligacaoTotal: p.ligacaoTotal }))
        );

        // CORRIGIDO: 4 parâmetros — inclui tolerância do atendente
        const { elegivel, motivo } = verificarElegibilidade(
          performance,
          totalAtendimentos,
          mediaAtendimentosTurno,
          atendente.tolerancia || 0
        );

        // CORRIGIDO: usa calcularBonificacao centralizado
        const bonificacao = elegivel ? calcularBonificacao(performance) : 0;

        return {
          atendente,
          chatTotal: totalChat,
          ligacaoTotal: totalLigacao,
          pontosTotais: Math.round(pontosTotais * 100) / 100,
          maxPontos,
          performance: Math.round(performance * 100) / 100,
          atendimentosTotais: totalAtendimentos,
          mediaAtendimentosTurno: Math.round(mediaAtendimentosTurno * 100) / 100,
          elegivel,
          motivo,
          bonificacao,
        };
      })
      .sort((a, b) => {
        const turnoOrder = ["A", "B", "C"];
        if (selectedTurno === "all") {
          const ai = turnoOrder.indexOf(a.atendente.turno);
          const bi = turnoOrder.indexOf(b.atendente.turno);
          if (ai !== bi) return ai - bi;
          return b.performance - a.performance;
        }
        return b.performance - a.performance;
      });
  }, [attendentes, producoes, selectedTurno]);

  // Performance por turno para o gráfico
  const performanceByShift = useMemo(() => {
    return ["A", "B", "C"].map((turno) => {
      const shiftPerfs = attendentes
        .filter((a) => a.turno === turno)
        .map((atendente) => {
          const prods = producoes.filter((p) => p.atendenteId === atendente.id);
          if (prods.length === 0) return 0;
          const dados = {
            chatTotal: prods.reduce((s, p) => s + p.chatTotal, 0),
            ligacaoTotal: prods.reduce((s, p) => s + p.ligacaoTotal, 0),
            chatNota5: prods.reduce((s, p) => s + p.chatNota5, 0),
            chatNota4: prods.reduce((s, p) => s + p.chatNota4, 0),
            chatNota3: prods.reduce((s, p) => s + p.chatNota3, 0),
            chatNota2: prods.reduce((s, p) => s + p.chatNota2, 0),
            chatNota1: prods.reduce((s, p) => s + p.chatNota1, 0),
            ligacaoExtrementeSatisfeito: prods.reduce((s, p) => s + p.ligacaoExtrementeSatisfeito, 0),
            ligacaoExcelente: prods.reduce((s, p) => s + p.ligacaoExcelente, 0),
            ligacaoBom: prods.reduce((s, p) => s + p.ligacaoBom, 0),
            ligacaoRegular: prods.reduce((s, p) => s + p.ligacaoRegular, 0),
            ligacaoRuim: prods.reduce((s, p) => s + p.ligacaoRuim, 0),
            ligacaoPessimo: prods.reduce((s, p) => s + p.ligacaoPessimo, 0),
          };
          return calcularPerformance(dados);
        });

      const avg = shiftPerfs.length > 0 ? shiftPerfs.reduce((a, b) => a + b, 0) / shiftPerfs.length : 0;
      return { turno: `Turno ${turno}`, performance: Math.round(avg * 100) / 100 };
    });
  }, [attendentes, producoes]);

  const monthlyEvolution = useMemo(() => {
    const topPerformers = performanceData.slice(0, 3);
    return Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
      const data: any = { mes: format(new Date(selectedYear, month - 1), "MMM", { locale: ptBR }) };
      topPerformers.forEach((performer) => {
        const producaoMes = todasProducoes.filter((p: any) =>
          p.atendenteId === performer.atendente.id && p.mes === month && p.ano === selectedYear
        );
        if (producaoMes.length === 0) { data[performer.atendente.nome] = 0; return; }
        const dados = {
          chatTotal: producaoMes.reduce((s: number, p: any) => s + p.chatTotal, 0),
          ligacaoTotal: producaoMes.reduce((s: number, p: any) => s + p.ligacaoTotal, 0),
          chatNota5: producaoMes.reduce((s: number, p: any) => s + p.chatNota5, 0),
          chatNota4: producaoMes.reduce((s: number, p: any) => s + p.chatNota4, 0),
          chatNota3: producaoMes.reduce((s: number, p: any) => s + p.chatNota3, 0),
          chatNota2: producaoMes.reduce((s: number, p: any) => s + p.chatNota2, 0),
          chatNota1: producaoMes.reduce((s: number, p: any) => s + p.chatNota1, 0),
          ligacaoExtrementeSatisfeito: producaoMes.reduce((s: number, p: any) => s + p.ligacaoExtrementeSatisfeito, 0),
          ligacaoExcelente: producaoMes.reduce((s: number, p: any) => s + p.ligacaoExcelente, 0),
          ligacaoBom: producaoMes.reduce((s: number, p: any) => s + p.ligacaoBom, 0),
          ligacaoRegular: producaoMes.reduce((s: number, p: any) => s + p.ligacaoRegular, 0),
          ligacaoRuim: producaoMes.reduce((s: number, p: any) => s + p.ligacaoRuim, 0),
          ligacaoPessimo: producaoMes.reduce((s: number, p: any) => s + p.ligacaoPessimo, 0),
        };
        data[performer.atendente.nome] = Math.round(calcularPerformance(dados) * 100) / 100;
      });
      return data;
    });
  }, [performanceData, todasProducoes, selectedYear]);

  const colors = ["rgb(43, 108, 255)", "rgb(34, 197, 94)", "rgb(249, 115, 22)"];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Individual</h1>
          <p className="text-muted-foreground mt-1">Análise de desempenho, ranking e elegibilidade para bonificação</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTurno} onValueChange={setSelectedTurno}>
            <SelectTrigger className="w-40 bg-[#1E293B] border-[#1E293B] text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Turnos</SelectItem>
              <SelectItem value="A">Turno A</SelectItem>
              <SelectItem value="B">Turno B</SelectItem>
              <SelectItem value="C">Turno C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-40 bg-[#1E293B] border-[#1E293B] text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {format(new Date(selectedYear, m - 1), "MMMM", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-24 bg-[#1E293B] border-[#1E293B] text-white"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Atendentes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{performanceData.length}</div></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Elegíveis à Bonificação</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{performanceData.filter((p) => p.elegivel).length}</div></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Não Elegíveis</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{performanceData.filter((p) => !p.elegivel).length}</div></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total em Bônus</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              R$ {performanceData.reduce((sum, p) => sum + p.bonificacao, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Performance por Turno</CardTitle>
            <CardDescription>Média de desempenho por equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceByShift}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="turno" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(2) : value}%`} />
                <Bar dataKey="performance" fill="rgb(43, 108, 255)" radius={[8, 8, 0, 0]}>
                  {performanceByShift.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal - Top 3</CardTitle>
            <CardDescription>Performance dos 3 melhores atendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="mes" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(2) : value}%`} />
                <Legend />
                {performanceData.slice(0, 3).map((performer, index) => (
                  <Line key={performer.atendente.id} type="monotone" dataKey={performer.atendente.nome} stroke={colors[index]} strokeWidth={2} dot={{ fill: colors[index], r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking de Atendentes
          </CardTitle>
          <CardDescription>
            Melhores atendentes elegíveis por turno (Mês: {format(new Date(selectedYear, selectedMonth - 1), "MMMM/yyyy", { locale: ptBR })})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {performanceData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum atendente encontrado</p>
            ) : (
              (() => {
                const turnoOrder = ["A", "B", "C"];
                const elegiveisGrouped = performanceData
                  .filter((d) => d.elegivel)
                  .reduce((acc, d) => {
                    const turno = d.atendente.turno;
                    if (!acc[turno]) acc[turno] = [];
                    acc[turno].push(d);
                    return acc;
                  }, {} as Record<string, typeof performanceData>);

                const topByTurno = turnoOrder
                  .filter((turno) => elegiveisGrouped[turno])
                  .map((turno) => elegiveisGrouped[turno].sort((a, b) => b.performance - a.performance)[0]);

                if (topByTurno.length === 0) {
                  return <p className="text-muted-foreground text-center py-8">Nenhum atendente elegível encontrado</p>;
                }

                return topByTurno.map((data, index) => (
                  <div key={data.atendente.id} className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 flex-shrink-0">
                      {index === 0 && <Trophy className="h-5 w-5 text-yellow-500" />}
                      {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                      {index === 2 && <Medal className="h-5 w-5 text-orange-600" />}
                      {index > 2 && <span className="text-sm font-bold text-primary">{index + 1}º</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{data.atendente.nome}</p>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex-shrink-0">
                          <CheckCircle className="mr-1 h-3 w-3" />Elegível
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {data.atendente.tipoAtuacao} • Turno {data.atendente.turno} • {data.atendimentosTotais} atendimentos
                        {/* CORRIGIDO: exibe mínimo do turno */}
                        {" "}(mín. {Math.ceil(data.mediaAtendimentosTurno)})
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">{data.performance.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">{data.pontosTotais}/{data.maxPontos} pts</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">R$ {data.bonificacao.toFixed(2)}</p>
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Todos os Atendentes</h2>
        <Card className="bg-card border-border">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Todos os Atendentes</CardTitle>
              <CardDescription>{performanceData.length} registros encontrados</CardDescription>
            </div>
            <div>
              <ExportPDFButton mes={selectedMonth} ano={selectedYear} turno={selectedTurno === "all" ? undefined : selectedTurno} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="p-2">Atendente</th>
                    <th className="p-2">Turno</th>
                    <th className="p-2 text-right">Chats</th>
                    <th className="p-2 text-right">Ligações</th>
                    <th className="p-2 text-right">Atend.</th>
                    {/* CORRIGIDO: renomeado para deixar claro que é mínimo de atendimentos */}
                    <th className="p-2 text-right">Mín. Turno</th>
                    <th className="p-2 text-right">Performance</th>
                    <th className="p-2 text-right">Pontos</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((d) => (
                    <tr key={d.atendente.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{d.atendente.nome}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{d.atendente.turno}</Badge>
                      </td>
                      <td className="p-2 text-right">{d.chatTotal}</td>
                      <td className="p-2 text-right">{d.ligacaoTotal}</td>
                      <td className="p-2 text-right font-semibold">{d.atendimentosTotais}</td>
                      {/* CORRIGIDO: exibe mínimo de atendimentos do turno (não média de performance) */}
                      <td className="p-2 text-right">{Math.ceil(d.mediaAtendimentosTurno)}</td>
                      <td className="p-2 text-right font-semibold">{d.performance.toFixed(2)}%</td>
                      <td className="p-2 text-right">{d.pontosTotais}</td>
                      <td className="p-2 text-center">
                        {d.elegivel ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✓ Elegível</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">✗ Excluído</Badge>
                        )}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">{d.motivo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
