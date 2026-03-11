import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { AlertCircle, MessageSquare, Phone, ArrowLeft } from "lucide-react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { BONIFICACAO_TABLE } from "@shared/bonificacao-rules";

interface Atendente {
  id: number;
  nome: string;
  turno: string;
  tolerancia?: number;
}

interface LancamentoPageProps {
  atendente: Atendente | null;
  producao: any;
  mediaDoTurno: number;
  onSubmit: (formData: any) => void;
  onBack: () => void;
  isLoading?: boolean;
  atendimentosDetalhados?: any[];
}

// Dados por semana para notas que não vêm da tabela de auditoria
interface DadosSemana {
  totalChat: number;
  totalLigacao: number;
  chatNota4: number;
  chatNota5: number;
  ligacaoExtremamenteSatisfeito: number;
  ligacaoExcelente: number;
}

const dadosSemanaVazio = (): DadosSemana => ({
  totalChat: 0,
  totalLigacao: 0,
  chatNota4: 0,
  chatNota5: 0,
  ligacaoExtremamenteSatisfeito: 0,
  ligacaoExcelente: 0,
});

export function LancamentoPage({
  atendente,
  producao,
  mediaDoTurno,
  onSubmit,
  onBack,
  isLoading = false,
  atendimentosDetalhados = [],
}: LancamentoPageProps) {
  const [semanas, setSemanas] = useState([
    [{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }],
  ]);

  type SemanaRange = { start: Date | null; end: Date | null };
  const [datasSemanas, setDatasSemanas] = useState<SemanaRange[]>([{ start: null, end: null }]);

  // CORRIGIDO: todos os dados variáveis por semana agrupados num único array
  const [dadosPorSemana, setDadosPorSemana] = useState<DadosSemana[]>([dadosSemanaVazio()]);

  const [obsDialogOpen, setObsDialogOpen] = useState(false);
  const [obsDialogText, setObsDialogText] = useState("");

  // Totais agregados calculados (somente leitura, derivados)
  const [totaisAgregados, setTotaisAgregados] = useState({
    chatTotal: 0,
    chatNota5: 0,
    chatNota4: 0,
    chatNota3: 0,
    chatNota2: 0,
    chatNota1: 0,
    chatSemNota: 0,
    ligacaoTotal: 0,
    ligacaoExtrementeSatisfeito: 0,
    ligacaoExcelente: 0,
    ligacaoBom: 0,
    ligacaoRegular: 0,
    ligacaoRuim: 0,
    ligacaoPessimo: 0,
  });

  // Helper para atualizar campo de uma semana específica
  const setDadoSemana = (semanaIdx: number, campo: keyof DadosSemana, valor: number) => {
    setDadosPorSemana(prev => {
      const novo = [...prev];
      novo[semanaIdx] = { ...novo[semanaIdx], [campo]: valor };
      return novo;
    });
  };

  // Carrega dados salvos de producao
  useEffect(() => {
    if (producao) {
      if (producao.semanas && Array.isArray(producao.semanas) && producao.semanas.length > 0) {
        try {
          const normalize = (d: Date | null) => {
            if (!d) return null;
            const iso = d.toISOString().slice(0, 10);
            const [y, m, day] = iso.split("-").map((v) => parseInt(v, 10));
            return new Date(y, m - 1, day);
          };

          const semanasFromProd: any[] = producao.semanas.map((s: any) => s.atendimentos || s || []);
          const datasFromProd = producao.semanas.map((s: any) => ({
            start: s?.dataInicio ? normalize(new Date(s.dataInicio)) : null,
            end: s?.dataFim ? normalize(new Date(s.dataFim)) : null,
          }));
          const dadosFromProd: DadosSemana[] = producao.semanas.map((s: any) => ({
            totalChat: Number(s.totalChatAtendimentos ?? s.totalAtendimentos ?? 0),
            totalLigacao: Number(s.totalLigacaoAtendimentos ?? 0),
            chatNota4: Number(s.chatNota4 ?? 0),
            chatNota5: Number(s.chatNota5 ?? 0),
            ligacaoExtremamenteSatisfeito: Number(s.ligacaoExtremamenteSatisfeito ?? 0),
            ligacaoExcelente: Number(s.ligacaoExcelente ?? 0),
          }));

          setSemanas(semanasFromProd.length > 0 ? semanasFromProd : [[{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]]);
          setDatasSemanas(datasFromProd.length > 0 ? datasFromProd : [{ start: null, end: null }]);
          setDadosPorSemana(dadosFromProd.length > 0 ? dadosFromProd : [dadosSemanaVazio()]);
        } catch (e) {
          setSemanas([[{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]]);
          setDatasSemanas([{ start: null, end: null }]);
          setDadosPorSemana([dadosSemanaVazio()]);
        }
      }
    } else {
      setSemanas([[{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]]);
      setDatasSemanas([{ start: null, end: null }]);
      setDadosPorSemana([dadosSemanaVazio()]);
    }
  }, [producao]);

  // Carrega atendimentos detalhados
  useEffect(() => {
    if (producao?.semanas?.length > 0) return;
    if (!atendimentosDetalhados?.length) return;

    console.log("📥 Carregando atendimentos detalhados:", atendimentosDetalhados);

    const novasSemanas: any[][] = [];
    const novasDatas: { start: Date | null; end: Date | null }[] = [];
    const novosDados: DadosSemana[] = [];

    atendimentosDetalhados.forEach(atendimento => {
      const dataAtendimento = atendimento.dataAtendimento ? new Date(atendimento.dataAtendimento) : new Date();
      const diaSemana = dataAtendimento.getDay();
      const inicio = new Date(dataAtendimento);
      const fim = new Date(dataAtendimento);
      const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
      inicio.setDate(dataAtendimento.getDate() - diasAteSegunda);
      fim.setDate(dataAtendimento.getDate() + (6 - diasAteSegunda));

      let semanaIndex = novasDatas.findIndex(s => s.start?.getTime() === inicio.getTime());
      if (semanaIndex === -1) {
        semanaIndex = novasSemanas.length;
        novasSemanas.push([]);
        novasDatas.push({ start: new Date(inicio), end: new Date(fim) });
        novosDados.push(dadosSemanaVazio());
      }

      novasSemanas[semanaIndex].push({
        cliente: atendimento.nomeCliente || "",
        obs: atendimento.auditoria || "",
        nota: atendimento.nota ? atendimento.nota.toString() : "",
        massiva: !!atendimento.massiva,
        retirarNota: !!atendimento.retirarNota,
        tipo: atendimento.tipo || "chat",
      });

      if (atendimento.tipo === "ligacao") {
        novosDados[semanaIndex].totalLigacao++;
      } else {
        novosDados[semanaIndex].totalChat++;
      }
    });

    setSemanas(novasSemanas.length > 0 ? novasSemanas : [[{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]]);
    setDatasSemanas(novasDatas.length > 0 ? novasDatas : [{ start: null, end: null }]);
    setDadosPorSemana(novosDados.length > 0 ? novosDados : [dadosSemanaVazio()]);
  }, [atendimentosDetalhados]);

  // Recalcula todos os totais agregados sempre que semanas ou dadosPorSemana mudam
  useEffect(() => {
    let chatNota1 = 0, chatNota2 = 0, chatNota3 = 0, chatNota4 = 0, chatNota5 = 0, chatSemNota = 0;
    let ligBom = 0, ligRegular = 0, ligRuim = 0, ligPessimo = 0, ligExcelente = 0, ligExtremamente = 0;
    let ligacaoTotalCount = 0;

    semanas.forEach((atendimentos, idx) => {
      const dados = dadosPorSemana[idx] ?? dadosSemanaVazio();

      // === CHAT ===
      const chatAtends = atendimentos.filter(a => !a.retirarNota && a.tipo === "chat");
      const n1 = chatAtends.filter(a => a.nota === "1").length;
      const n2 = chatAtends.filter(a => a.nota === "2").length;
      const n3 = chatAtends.filter(a => a.nota === "3").length;
      // CORRIGIDO: notas 4 e 5 são por semana agora
      const n4 = dados.chatNota4;
      const n5 = dados.chatNota5;

      chatNota1 += n1;
      chatNota2 += n2;
      chatNota3 += n3;
      chatNota4 += n4;
      chatNota5 += n5;

      const notasRegistradas = n1 + n2 + n3 + n4 + n5;
      chatSemNota += Math.max(0, dados.totalChat - notasRegistradas);

      // === LIGAÇÃO ===
      const ligAtends = atendimentos.filter(a => !a.retirarNota && a.tipo === "ligacao");
      const ligBoasAtt = ligAtends.filter(a => a.nota === "bom").length;
      const ligRegularesAtt = ligAtends.filter(a => a.nota === "regular").length;
      const ligRuinsAtt = ligAtends.filter(a => a.nota === "ruim").length;
      const ligPessimosAtt = ligAtends.filter(a => a.nota === "pessimo").length;

      ligBom += ligBoasAtt;
      ligRegular += ligRegularesAtt;
      ligRuim += ligRuinsAtt;
      ligPessimo += ligPessimosAtt;

      // CORRIGIDO: Extremamente Satisfeito e Excelente também são por semana
      ligExcelente += dados.ligacaoExcelente;
      ligExtremamente += dados.ligacaoExtremamenteSatisfeito;

      // Soma o total de ligações por semana
      ligacaoTotalCount += dados.totalLigacao;

      // Ligações sem nota: total - (anotadas na tabela + por semana)
      const ligAnotadas = ligBoasAtt + ligRegularesAtt + ligRuinsAtt + ligPessimosAtt;
      const ligComNotasSemana = dados.ligacaoExcelente + dados.ligacaoExtremamenteSatisfeito;
      // Não precisamos contar sem nota para ligações, pois elas são armazenadas em atendimentosDetalhados
    });

    setTotaisAgregados({
      chatTotal: chatNota1 + chatNota2 + chatNota3 + chatNota4 + chatNota5 + chatSemNota,
      chatNota1, chatNota2, chatNota3, chatNota4, chatNota5, chatSemNota,
      ligacaoTotal: ligacaoTotalCount,
      ligacaoBom: ligBom,
      ligacaoRegular: ligRegular,
      ligacaoRuim: ligRuim,
      ligacaoPessimo: ligPessimo,
      ligacaoExcelente: ligExcelente,
      ligacaoExtrementeSatisfeito: ligExtremamente,
    });
  }, [semanas, dadosPorSemana]);

  const chatSum = totaisAgregados.chatNota5 + totaisAgregados.chatNota4 + totaisAgregados.chatNota3 + totaisAgregados.chatNota2 + totaisAgregados.chatNota1;
  const ligacaoSum = totaisAgregados.ligacaoExtrementeSatisfeito + totaisAgregados.ligacaoExcelente + totaisAgregados.ligacaoBom + totaisAgregados.ligacaoRegular + totaisAgregados.ligacaoRuim + totaisAgregados.ligacaoPessimo;

  const chatValidation = chatSum <= totaisAgregados.chatTotal;
  const ligacaoValidation = ligacaoSum <= totaisAgregados.ligacaoTotal;

  const handleSubmit = () => {
    if (!chatValidation || !ligacaoValidation) {
      toast.error("A soma das notas não pode ser maior que o total de atendimentos");
      return;
    }

    const formatDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

    const semanasComMetadados = semanas.map((atendimentos, idx) => {
      const dados = dadosPorSemana[idx] ?? dadosSemanaVazio();
      return {
        dataInicio: formatDate(datasSemanas[idx]?.start ?? null),
        dataFim: formatDate(datasSemanas[idx]?.end ?? null),
        totalChatAtendimentos: dados.totalChat,
        totalLigacaoAtendimentos: dados.totalLigacao,
        totalAtendimentos: dados.totalChat + dados.totalLigacao,
        // CORRIGIDO: salva notas 4, 5 e Excelente/ExtremamenteSatisfeito por semana
        chatNota4: dados.chatNota4,
        chatNota5: dados.chatNota5,
        ligacaoExtremamenteSatisfeito: dados.ligacaoExtremamenteSatisfeito,
        ligacaoExcelente: dados.ligacaoExcelente,
        atendimentos,
      };
    });

    const chatScore =
      totaisAgregados.chatNota5 * 5 +
      totaisAgregados.chatNota4 * 2 +
      totaisAgregados.chatNota3 * -3 +
      totaisAgregados.chatNota2 * -10 +
      totaisAgregados.chatNota1 * -10;

    const ligacaoScore =
      totaisAgregados.ligacaoExtrementeSatisfeito * 5 +
      totaisAgregados.ligacaoExcelente * 2 +
      totaisAgregados.ligacaoBom * 1 +
      totaisAgregados.ligacaoRegular * 0 +
      totaisAgregados.ligacaoRuim * -10 +
      totaisAgregados.ligacaoPessimo * -10;

    const totalScore = chatScore + ligacaoScore;
    const maxScore = (chatSum + ligacaoSum) * 5;
    const performance = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const totalAtendimentos = totaisAgregados.chatTotal + totaisAgregados.ligacaoTotal;
    const elegivel = totalAtendimentos >= mediaDoTurno && performance >= 80;

    let bonificacao = 0;
    for (const [perfMin, bonus] of BONIFICACAO_TABLE) {
      if (performance >= perfMin) { bonificacao = bonus; break; }
    }

    onSubmit({
      chatTotal: totaisAgregados.chatTotal.toString(),
      chatNota5: totaisAgregados.chatNota5.toString(),
      chatNota4: totaisAgregados.chatNota4.toString(),
      chatNota3: totaisAgregados.chatNota3.toString(),
      chatNota2: totaisAgregados.chatNota2.toString(),
      chatNota1: totaisAgregados.chatNota1.toString(),
      chatSemNota: totaisAgregados.chatSemNota.toString(),
      ligacaoTotal: totaisAgregados.ligacaoTotal.toString(),
      ligacaoExtrementeSatisfeito: totaisAgregados.ligacaoExtrementeSatisfeito.toString(),
      ligacaoExcelente: totaisAgregados.ligacaoExcelente.toString(),
      ligacaoBom: totaisAgregados.ligacaoBom.toString(),
      ligacaoRegular: totaisAgregados.ligacaoRegular.toString(),
      ligacaoRuim: totaisAgregados.ligacaoRuim.toString(),
      ligacaoPessimo: totaisAgregados.ligacaoPessimo.toString(),
      bonificacao: bonificacao.toFixed(2),
      totalScore: totalScore.toString(),
      performance: performance.toFixed(1),
      totalAtendimentos: totalAtendimentos.toString(),
      elegivel,
      historicoAtendimentos: semanasComMetadados,
      datasSemanas,
    });
  };

  // Métricas para exibição
  const chatScore =
    totaisAgregados.chatNota5 * 5 +
    totaisAgregados.chatNota4 * 2 +
    totaisAgregados.chatNota3 * -3 +
    totaisAgregados.chatNota2 * -10 +
    totaisAgregados.chatNota1 * -10;

  const ligacaoScore =
    totaisAgregados.ligacaoExtrementeSatisfeito * 5 +
    totaisAgregados.ligacaoExcelente * 2 +
    totaisAgregados.ligacaoBom * 1 +
    totaisAgregados.ligacaoRegular * 0 +
    totaisAgregados.ligacaoRuim * -10 +
    totaisAgregados.ligacaoPessimo * -10;

  const totalScore = chatScore + ligacaoScore;
  const maxScore = (chatSum + ligacaoSum) * 5;
  const performance = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const totalAtendimentos = totaisAgregados.chatTotal + totaisAgregados.ligacaoTotal;
  const elegivel = totalAtendimentos >= mediaDoTurno && performance >= 80;

  let bonificacao = 0;
  for (const [perfMin, bonus] of BONIFICACAO_TABLE) {
    if (performance >= perfMin) { bonificacao = bonus; break; }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lançamento de Produção</h1>
          <p className="text-muted-foreground mt-1">
            {atendente ? `Atendente: ${atendente.nome} (Turno ${atendente.turno})` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={onBack} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Atendentes
          </Button>
          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => {
            setSemanas(prev => [...prev, [
              { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" },
              { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "ligacao" },
            ]]);
            setDatasSemanas(prev => [...prev, { start: null, end: null }]);
            // CORRIGIDO: nova semana começa com dados zerados e independentes
            setDadosPorSemana(prev => [...prev, dadosSemanaVazio()]);
            toast.success("Nova semana adicionada com sucesso!");
          }}>
            + Adicionar nova semana
          </Button>
        </div>
      </div>

      <div className="space-y-6 pb-24">
        {/* ===== TABELAS DE CHAT POR SEMANA ===== */}
        {semanas.map((atendimentos, semanaIdx) => {
          const dados = dadosPorSemana[semanaIdx] ?? dadosSemanaVazio();
          return (
            <Card className="bg-card border-border mb-8" key={semanaIdx}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  ATENDIMENTOS - OPA
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Semana {semanaIdx + 1}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-1">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground">Selecione o intervalo da semana</span>
                        <Calendar
                          mode="range"
                          selected={datasSemanas[semanaIdx]?.start && datasSemanas[semanaIdx]?.end
                            ? { from: datasSemanas[semanaIdx].start, to: datasSemanas[semanaIdx].end }
                            : undefined}
                          onSelect={range => {
                            setDatasSemanas(prev => {
                              const novo = [...prev];
                              const normalize = (d: Date | null) => {
                                if (!d) return null;
                                const iso = d.toISOString().slice(0, 10);
                                const [y, m, day] = iso.split("-").map(v => parseInt(v, 10));
                                return new Date(y, m - 1, day);
                              };
                              novo[semanaIdx] = {
                                start: normalize((range && 'from' in range ? range.from : null) as Date | null),
                                end: normalize((range && 'to' in range ? range.to : null) as Date | null),
                              };
                              return novo;
                            });
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  {datasSemanas[semanaIdx]?.start && datasSemanas[semanaIdx]?.end && (
                    <Badge className="ml-2 px-3 py-1 text-base font-bold bg-blue-600 text-white rounded shadow">
                      {datasSemanas[semanaIdx].start!.toLocaleDateString()} até {datasSemanas[semanaIdx].end!.toLocaleDateString()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border px-2 py-1 text-left">Cliente</th>
                        <th className="border px-2 py-1 text-left">Auditoria</th>
                        <th className="border px-2 py-1 text-left">Nota</th>
                        <th className="border px-2 py-1 text-center">Massiva?</th>
                        <th className="border px-2 py-1 text-center">Retirar?</th>
                        <th className="border px-2 py-1 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atendimentos
                        .map((a, idx) => ({ ...a, idx }))
                        .filter(a => a.tipo === "chat")
                        .map(a => (
                          <tr key={a.idx} className="hover:bg-muted/50">
                            <td className="border px-2 py-2">
                              <Input value={a.cliente} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, cliente: e.target.value } : b) : sem))} placeholder="Cliente" className="h-8" />
                            </td>
                            <td className="border px-2 py-2">
                              <div className="flex items-center gap-2">
                                <Input value={a.obs} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, obs: e.target.value } : b) : sem))} placeholder="Auditoria" className="h-8 flex-1" />
                                <Button size="sm" variant="ghost" onClick={() => { setObsDialogText(a.obs || ""); setObsDialogOpen(true); }} title="Ver auditoria">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="border px-2 py-2">
                              <select value={a.nota} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, nota: e.target.value } : b) : sem))}
                                className="w-16 h-8 border rounded bg-background text-foreground dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-primary/60 transition-colors">
                                <option value="">-</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                              </select>
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Checkbox checked={a.massiva} onCheckedChange={val => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, massiva: !!val } : b) : sem))} className="data-[state=checked]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] transition-all duration-200" />
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Checkbox checked={a.retirarNota} onCheckedChange={val => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, retirarNota: !!val } : b) : sem))} className="data-[state=checked]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] transition-all duration-200" />
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Button size="sm" variant="ghost" onClick={() => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.filter((_, j) => j !== a.idx) : sem))} disabled={atendimentos.length === 1}>
                                Remover
                              </Button>
                            </td>
                          </tr>
                        ))}

                      {/* Linha: Total de Atendimentos Chat */}
                      <tr className="bg-blue-50/30 dark:bg-blue-900/20">
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total de Atendimentos da Semana (Chat)</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.totalChat || ""} onChange={e => setDadoSemana(semanaIdx, "totalChat", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                      {/* CORRIGIDO: notas 4 e 5 agora são por semana */}
                      <tr>
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total de notas 4 (Semana {semanaIdx + 1})</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.chatNota4 || ""} onChange={e => setDadoSemana(semanaIdx, "chatNota4", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total de notas 5 (Semana {semanaIdx + 1})</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.chatNota5 || ""} onChange={e => setDadoSemana(semanaIdx, "chatNota5", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Atendimentos sem nota</td>
                        <td className="border px-2 py-2">
                          <div className="h-8 flex items-center px-3 rounded border bg-muted/50 text-base font-semibold">
                            {Math.max(0, dados.totalChat - (atendimentos.filter(a => !a.retirarNota && a.tipo === "chat" && ["1", "2", "3"].includes(a.nota)).length + dados.chatNota4 + dados.chatNota5))}
                          </div>
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? [...sem, { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }] : sem))}>
                    + Adicionar Atendimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* ===== TABELAS DE LIGAÇÃO POR SEMANA ===== */}
        {semanas.map((atendimentos, semanaIdx) => {
          const dados = dadosPorSemana[semanaIdx] ?? dadosSemanaVazio();
          return (
            <Card className="bg-card border-border mb-8" key={"ligacao-" + semanaIdx}>
              <CardHeader>
                <CardTitle>
                  ATENDIMENTOS - LIGAÇÕES
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Semana {semanaIdx + 1}</span>
                  {datasSemanas[semanaIdx]?.start && datasSemanas[semanaIdx]?.end && (
                    <Badge className="ml-2 px-3 py-1 text-base font-bold bg-blue-600 text-white rounded shadow">
                      {datasSemanas[semanaIdx].start!.toLocaleDateString()} até {datasSemanas[semanaIdx].end!.toLocaleDateString()}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border px-2 py-1 text-left">Cliente</th>
                        <th className="border px-2 py-1 text-left">Auditoria</th>
                        <th className="border px-2 py-1 text-left">Nota</th>
                        <th className="border px-2 py-1 text-center">Massiva?</th>
                        <th className="border px-2 py-1 text-center">Retirar?</th>
                        <th className="border px-2 py-1 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atendimentos
                        .map((a, idx) => ({ ...a, idx }))
                        .filter(a => a.tipo === "ligacao")
                        .map(a => (
                          <tr key={a.idx} className="hover:bg-muted/50">
                            <td className="border px-2 py-2">
                              <Input value={a.cliente} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, cliente: e.target.value } : b) : sem))} placeholder="Cliente" className="h-8" />
                            </td>
                            <td className="border px-2 py-2">
                              <div className="flex items-center gap-2">
                                <Input value={a.obs} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, obs: e.target.value } : b) : sem))} placeholder="Auditoria" className="h-8 flex-1" />
                                <Button size="sm" variant="ghost" onClick={() => { setObsDialogText(a.obs || ""); setObsDialogOpen(true); }} title="Ver auditoria">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                            <td className="border px-2 py-2">
                              <select value={a.nota} onChange={e => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, nota: e.target.value } : b) : sem))}
                                className="w-24 h-8 border rounded bg-background text-foreground dark:bg-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-primary/60 transition-colors">
                                <option value="">-</option>
                                <option value="bom">Bom</option>
                                <option value="regular">Regular</option>
                                <option value="ruim">Ruim</option>
                                <option value="pessimo">Péssimo</option>
                              </select>
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Checkbox checked={a.massiva} onCheckedChange={val => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, massiva: !!val } : b) : sem))} className="data-[state=checked]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] transition-all duration-200" />
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Checkbox checked={a.retirarNota} onCheckedChange={val => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.map((b, j) => j === a.idx ? { ...b, retirarNota: !!val } : b) : sem))} className="data-[state=checked]:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] transition-all duration-200" />
                            </td>
                            <td className="border px-2 py-2 text-center">
                              <Button size="sm" variant="ghost" onClick={() => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? sem.filter((_, j) => j !== a.idx) : sem))} disabled={atendimentos.length === 1}>
                                Remover
                              </Button>
                            </td>
                          </tr>
                        ))}

                      {/* Linha: Total de Atendimentos Ligação */}
                      <tr className="bg-blue-50/30 dark:bg-blue-900/20">
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total de Atendimentos da Semana (Ligação)</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.totalLigacao || ""} onChange={e => setDadoSemana(semanaIdx, "totalLigacao", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                      {/* CORRIGIDO: Extremamente Satisfeito e Excelente agora são por semana */}
                      <tr>
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total Extremamente Satisfeito (Semana {semanaIdx + 1})</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.ligacaoExtremamenteSatisfeito || ""} onChange={e => setDadoSemana(semanaIdx, "ligacaoExtremamenteSatisfeito", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border px-2 py-2 font-medium text-xs">Total Excelente (Semana {semanaIdx + 1})</td>
                        <td className="border px-2 py-2">
                          <Input type="number" value={dados.ligacaoExcelente || ""} onChange={e => setDadoSemana(semanaIdx, "ligacaoExcelente", parseInt(e.target.value) || 0)} placeholder="0" className="h-8" />
                        </td>
                        <td colSpan={3} className="border px-2 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setSemanas(prev => prev.map((sem, i) => i === semanaIdx ? [...sem, { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "ligacao" }] : sem))}>
                    + Adicionar Atendimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* ===== RESUMO CHAT ===== */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-400" />
              <div>
                <CardTitle className="text-xl">Atendimento por Chat</CardTitle>
                <CardDescription>Notas de 1 a 5 estrelas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Total de Atendimentos</label>
              <div className="h-10 flex items-center px-3 rounded border bg-muted/30 text-base font-semibold">{totaisAgregados.chatTotal}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "⭐⭐⭐⭐⭐ Nota 5 (+5)", val: totaisAgregados.chatNota5 },
                { label: "⭐⭐⭐⭐ Nota 4 (+2)", val: totaisAgregados.chatNota4 },
                { label: "⭐⭐⭐ Nota 3 (-3)", val: totaisAgregados.chatNota3 },
                { label: "⭐⭐ Nota 2 (-10)", val: totaisAgregados.chatNota2 },
                { label: "⭐ Nota 1 (-10)", val: totaisAgregados.chatNota1 },
                { label: "Sem Nota", val: totaisAgregados.chatSemNota },
              ].map(({ label, val }) => (
                <div key={label}>
                  <label className="text-xs font-medium mb-1 block">{label}</label>
                  <div className="h-10 flex items-center px-3 rounded border bg-muted/30 text-base font-semibold">{val}</div>
                </div>
              ))}
            </div>
            {!chatValidation && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500 text-sm">A soma das notas não pode ser maior que o total de atendimentos</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ===== RESUMO LIGAÇÃO ===== */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-green-500" />
              <div>
                <CardTitle className="text-xl">Atendimento por Ligação</CardTitle>
                <CardDescription>Notas de 1 a 5 categorias</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Total de Atendimentos</label>
              <div className="h-10 flex items-center px-3 rounded border bg-muted/30 text-base font-semibold">{totaisAgregados.ligacaoTotal}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Extremamente Satisfeito (+5)", val: totaisAgregados.ligacaoExtrementeSatisfeito },
                { label: "Excelente (+2)", val: totaisAgregados.ligacaoExcelente },
                { label: "Bom (+1)", val: totaisAgregados.ligacaoBom },
                { label: "Regular (0)", val: totaisAgregados.ligacaoRegular },
                { label: "Ruim (-10)", val: totaisAgregados.ligacaoRuim },
                { label: "Péssimo (-10)", val: totaisAgregados.ligacaoPessimo },
              ].map(({ label, val }) => (
                <div key={label}>
                  <label className="text-xs font-medium mb-1 block">{label}</label>
                  <div className="h-10 flex items-center px-3 rounded border bg-muted/30 text-base font-semibold">{val}</div>
                </div>
              ))}
            </div>
            {!ligacaoValidation && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500 text-sm">A soma das categorias não pode ser maior que o total de atendimentos</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* ===== RESUMO CÁLCULO ===== */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Resumo do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Total Atendimentos</p>
                <p className="text-3xl font-bold">{totalAtendimentos}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Média do Turno</p>
                <p className="text-3xl font-bold">{Math.round(mediaDoTurno)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pontuação Obtida</p>
                <p className="text-3xl font-bold">{totalScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pontuação Máxima</p>
                <p className="text-3xl font-bold">{maxScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Performance</p>
                <p className={`text-3xl font-bold ${performance >= 80 ? "text-green-400" : "text-red-400"}`}>
                  {performance.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Bonificação</p>
                <p className={`text-3xl font-bold ${elegivel ? "text-green-400" : "text-red-400"}`}>
                  R$ {bonificacao.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/50 p-5">
        <div className="flex justify-center gap-4 max-w-7xl mx-auto">
          <Button variant="outline" size="lg" onClick={onBack} className="min-w-32">Cancelar</Button>
          <Button size="lg" onClick={handleSubmit} className="min-w-32 bg-primary text-primary-foreground hover:bg-primary/90">Salvar Lançamento</Button>
        </div>
      </div>

      {/* Dialog auditoria */}
      <Dialog open={obsDialogOpen} onOpenChange={setObsDialogOpen}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>Auditoria</DialogTitle>
            <DialogDescription>Visualização ampliada do campo de auditoria</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <textarea readOnly value={obsDialogText} className="w-full h-64 p-3 rounded border resize-none bg-background text-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
