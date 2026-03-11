import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Eye, Trash2, Calendar } from "lucide-react";
import { ExportPDFButton } from "@/components/ExportPDFButton";
import { verificarElegibilidade, calcularMediaAtendimentosTurno, calcularPerformance, calcularBonificacao } from "@/lib/elegibilidade";

export default function Historico() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [searchNome, setSearchNome] = useState("");
  const [filterTurno, setFilterTurno] = useState<string | null>(null);
  const [filterElegibilidade, setFilterElegibilidade] = useState<string | null>(null);
  const [selectedProducao, setSelectedProducao] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const atendenteQuery = trpc.atendentes.list.useQuery();
  const producaoQuery = trpc.producao.getByMesAno.useQuery({ mes, ano });
  const deleteProducaoMutation = trpc.producao.delete.useMutation();

  const atendentes = atendenteQuery.data || [];
  const producoes = producaoQuery.data || [];

  const producoesRecalc = useMemo(() => {
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
      const { elegivel: elegivelRecalc, motivo } = verificarElegibilidade(
        performanceRecalc,
        totalAtendimentos,
        mediaAtendimentosTurno,
        atendente?.tolerancia || 0
      );

      return {
        ...producao,
        performanceRecalc: Math.round(performanceRecalc * 100) / 100,
        totalAtendimentos,
        mediaAtendimentosTurno,
        elegivelRecalc: elegivelRecalc ? 1 : 0,
        motivoRecalc: motivo,
        // CORRIGIDO: recalcula bonificação — não usa o valor antigo do banco
        bonificacao: (elegivelRecalc ? calcularBonificacao(performanceRecalc) : 0).toString(),
      };
    });
  }, [producoes, atendentes]);

  const filteredProducoes = producoesRecalc.filter((p) => {
    const atendente = atendentes.find((a) => a.id === p.atendenteId);
    if (!atendente) return false;
    if (searchNome && !atendente.nome.toLowerCase().includes(searchNome.toLowerCase())) return false;
    if (filterTurno && atendente.turno !== filterTurno) return false;
    if (filterElegibilidade === "elegivel" && p.elegivelRecalc !== 1) return false;
    if (filterElegibilidade === "nao-elegivel" && p.elegivelRecalc === 1) return false;
    return true;
  });

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar este registro?")) {
      try {
        await deleteProducaoMutation.mutateAsync({ id });
        producaoQuery.refetch();
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const getAtendenteName = (id: number) => atendentes.find((a) => a.id === id)?.nome || "Desconhecido";
  const getAtendenteTurno = (id: number) => atendentes.find((a) => a.id === id)?.turno || "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico de Produção</h1>
          <p className="text-muted-foreground mt-1">Visualize e gerencie registros de produção anteriores</p>
        </div>
        <div className="flex items-center gap-4">
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
          <ExportPDFButton mes={mes} ano={ano} turno={filterTurno || undefined} />
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Pesquisar por nome..."
                value={searchNome}
                onChange={(e) => setSearchNome(e.target.value)}
                className="py-2 text-sm border rounded-md bg-popover border-border text-foreground"
              />
            </div>
            <Select value={filterTurno || "all"} onValueChange={(v) => setFilterTurno(v === "all" ? null : v)}>
              <SelectTrigger className="w-auto py-2 text-sm rounded-md border bg-popover border-border text-foreground">
                <SelectValue placeholder="Todos os Turnos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Turnos</SelectItem>
                <SelectItem value="A">Turno A</SelectItem>
                <SelectItem value="B">Turno B</SelectItem>
                <SelectItem value="C">Turno C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterElegibilidade || "all"} onValueChange={(v) => setFilterElegibilidade(v === "all" ? null : v)}>
              <SelectTrigger className="w-auto py-2 text-sm rounded-md border bg-popover border-border text-foreground">
                <SelectValue placeholder="Elegibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="elegivel">Elegíveis</SelectItem>
                <SelectItem value="nao-elegivel">Não Elegíveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Registros de Produção</CardTitle>
          <CardDescription>
            {filteredProducoes.length} registro{filteredProducoes.length !== 1 ? "s" : ""} encontrado{filteredProducoes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducoes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum registro encontrado com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-foreground">Atendente</TableHead>
                    <TableHead className="text-foreground">Turno</TableHead>
                    <TableHead className="text-foreground text-right">Chat</TableHead>
                    <TableHead className="text-foreground text-right">Ligação</TableHead>
                    <TableHead className="text-foreground text-right">Atend. / Mín.</TableHead>
                    <TableHead className="text-foreground text-right">Performance</TableHead>
                    <TableHead className="text-foreground text-center">Status</TableHead>
                    <TableHead className="text-foreground text-right">Bonificação</TableHead>
                    <TableHead className="text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducoes.map((producao) => (
                    <TableRow key={producao.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium">{getAtendenteName(producao.atendenteId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {getAtendenteTurno(producao.atendenteId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{producao.chatTotal}</TableCell>
                      <TableCell className="text-right font-medium">{producao.ligacaoTotal}</TableCell>
                      {/* CORRIGIDO: exibe atendimentos totais vs mínimo do turno */}
                      <TableCell className="text-right text-sm">
                        <span className={producao.totalAtendimentos >= producao.mediaAtendimentosTurno ? "text-emerald-400" : "text-red-400"}>
                          {producao.totalAtendimentos}
                        </span>
                        <span className="text-muted-foreground"> / {Math.ceil(producao.mediaAtendimentosTurno)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{producao.performanceRecalc.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {producao.elegivelRecalc === 1 ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Elegível</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Não Elegível</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">
                        R$ {parseFloat(producao.bonificacao).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedProducao(producao); setIsDetailOpen(true); }} className="text-primary hover:text-primary hover:bg-primary/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(producao.id)} className="text-red-400 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes do Lançamento</DialogTitle>
            <DialogDescription>
              {selectedProducao && getAtendenteName(selectedProducao.atendenteId)} - {selectedProducao?.mes}/{selectedProducao?.ano}
            </DialogDescription>
          </DialogHeader>
          {selectedProducao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Atendente</p><p className="font-medium">{getAtendenteName(selectedProducao.atendenteId)}</p></div>
                <div><p className="text-sm text-muted-foreground">Turno</p><p className="font-medium">{getAtendenteTurno(selectedProducao.atendenteId)}</p></div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Chat</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Nota 5 (+5)</p><p className="font-medium">{selectedProducao.chatNota5 || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Nota 4 (+2)</p><p className="font-medium">{selectedProducao.chatNota4 || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Nota 3 (-3)</p><p className="font-medium">{selectedProducao.chatNota3 || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Nota 2 (-10)</p><p className="font-medium">{selectedProducao.chatNota2 || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Nota 1 (-10)</p><p className="font-medium">{selectedProducao.chatNota1 || 0}</p></div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-3">Ligação</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Ext. Satisfeito (+5)</p><p className="font-medium">{selectedProducao.ligacaoExtrementeSatisfeito || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Excelente (+2)</p><p className="font-medium">{selectedProducao.ligacaoExcelente || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Bom (+1)</p><p className="font-medium">{selectedProducao.ligacaoBom || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Regular (0)</p><p className="font-medium">{selectedProducao.ligacaoRegular || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Ruim (-10)</p><p className="font-medium">{selectedProducao.ligacaoRuim || 0}</p></div>
                  <div><p className="text-sm text-muted-foreground">Péssimo (-10)</p><p className="font-medium">{selectedProducao.ligacaoPessimo || 0}</p></div>
                </div>
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between"><p className="text-muted-foreground">Performance</p><p className="font-semibold">{selectedProducao.performanceRecalc.toFixed(2)}%</p></div>
                {/* CORRIGIDO: exibe atendimentos vs mínimo do turno */}
                <div className="flex justify-between"><p className="text-muted-foreground">Atendimentos / Mínimo do Turno</p><p className="font-semibold">{selectedProducao.totalAtendimentos} / {Math.ceil(selectedProducao.mediaAtendimentosTurno)}</p></div>
                <div className="flex justify-between"><p className="text-muted-foreground">Elegível</p><p className={`font-semibold ${selectedProducao.elegivelRecalc ? "text-emerald-400" : "text-red-400"}`}>{selectedProducao.elegivelRecalc ? "Sim" : "Não"}</p></div>
                {selectedProducao.motivoRecalc && <div className="flex justify-between"><p className="text-muted-foreground">Motivo</p><p className="text-sm text-red-400 text-right max-w-xs">{selectedProducao.motivoRecalc}</p></div>}
                <div className="flex justify-between"><p className="text-muted-foreground">Bonificação</p><p className="font-semibold text-emerald-400">R$ {parseFloat(selectedProducao.bonificacao).toFixed(2)}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
