import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { DollarSign, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { verificarElegibilidade, calcularMediaAtendimentosTurno, calcularPerformance, calcularBonificacao } from "@/lib/elegibilidade";

export default function Comissoes() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const producaoQuery = trpc.producao.getByMesAno.useQuery({ mes, ano });
  const atendentesQuery = trpc.atendentes.list.useQuery();

  const producoes = producaoQuery.data || [];
  const atendentes = (atendentesQuery.data || []).filter((a) => a.status === "Ativo");

  const comissoesList = useMemo(() => {
    return producoes
      .map((producao) => {
        const atendente = atendentes.find((a) => a.id === producao.atendenteId);
        if (!atendente) return null;

        // CORRIGIDO: usa calcularPerformance centralizado
        const performanceRecalc = calcularPerformance(producao);
        const totalAtendimentos = producao.chatTotal + producao.ligacaoTotal;

        // CORRIGIDO: média de ATENDIMENTOS do turno (não de performance)
        const producoesDoTurno = producoes.filter((p) => {
          const att = atendentes.find((a) => a.id === p.atendenteId);
          return att?.turno === atendente.turno;
        });

        const mediaAtendimentosTurno = calcularMediaAtendimentosTurno(
          producoesDoTurno.map((p) => ({ chatTotal: p.chatTotal, ligacaoTotal: p.ligacaoTotal }))
        );

        // CORRIGIDO: 4 parâmetros — inclui tolerância do atendente
        const { elegivel: elegivelRecalc, motivo } = verificarElegibilidade(
          performanceRecalc,
          totalAtendimentos,
          mediaAtendimentosTurno,
          atendente.tolerancia || 0
        );

        return {
          ...producao,
          atendenteName: atendente.nome || "N/A",
          atendenteTurno: atendente.turno || "N/A",
          performanceRecalc: Math.round(performanceRecalc * 100) / 100,
          totalAtendimentos,
          mediaAtendimentosTurno,
          elegivelRecalc: elegivelRecalc ? 1 : 0,
          motivoRecalc: motivo,
          // CORRIGIDO: recalcula bonificação — não usa o valor antigo do banco
          bonificacao: (elegivelRecalc ? calcularBonificacao(performanceRecalc) : 0).toString(),
        };
      })
      .filter(Boolean);
  }, [producoes, atendentes]);

  const elegiveisCount = comissoesList.filter((p) => p.elegivelRecalc === 1).length;
  const naoElegiveisCount = comissoesList.filter((p) => p.elegivelRecalc === 0).length;
  const totalBonificacao = comissoesList.reduce((sum, p) => sum + parseFloat(p.bonificacao), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Comissões</h1>
          <p className="text-muted-foreground mt-1">Controle financeiro e aprovações</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalBonificacao.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Comissões totais</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{elegiveisCount}</div>
            <p className="text-xs text-muted-foreground">Elegíveis para bônus</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{naoElegiveisCount}</div>
            <p className="text-xs text-muted-foreground">Não elegíveis</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Detalhamento de Comissões</CardTitle>
          <CardDescription>Status de elegibilidade e valores de bonificação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-foreground">Nome</TableHead>
                  <TableHead className="text-foreground">Turno</TableHead>
                  <TableHead className="text-foreground text-right">Atendimentos</TableHead>
                  <TableHead className="text-foreground text-right">Mínimo Turno</TableHead>
                  <TableHead className="text-foreground text-right">Performance</TableHead>
                  <TableHead className="text-foreground text-center">Status</TableHead>
                  <TableHead className="text-foreground text-right">Bonificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comissoesList.map((comissao) => (
                  <TableRow key={comissao.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium">{comissao.atendenteName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Turno {comissao.atendenteTurno}
                      </Badge>
                    </TableCell>
                    {/* CORRIGIDO: exibe atendimentos reais vs mínimo do turno */}
                    <TableCell className="text-right font-medium">{comissao.totalAtendimentos}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{Math.ceil(comissao.mediaAtendimentosTurno)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-medium">{comissao.performanceRecalc.toFixed(2)}%</span>
                        <Progress value={comissao.performanceRecalc} className="w-24 h-2" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {comissao.elegivelRecalc === 1 ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />Aprovado
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                          <XCircle className="w-3 h-3 mr-1" />Reprovado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400">
                      R$ {parseFloat(comissao.bonificacao).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {naoElegiveisCount > 0 && (
        <Card className="bg-card border-border border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400">Motivos de Não Elegibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {comissoesList
                .filter((c) => c.elegivelRecalc === 0)
                .map((comissao) => (
                  <div key={comissao.id} className="flex justify-between items-start p-2 bg-red-500/10 rounded border border-red-500/20">
                    <div>
                      <p className="font-medium text-foreground">{comissao.atendenteName}</p>
                      <p className="text-sm text-red-400">{comissao.motivoRecalc}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{comissao.performanceRecalc.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{comissao.totalAtendimentos} / {Math.ceil(comissao.mediaAtendimentosTurno)} atend.</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
