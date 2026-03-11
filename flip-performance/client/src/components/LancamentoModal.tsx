import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, MessageSquare, Phone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Tabela de bonificação - definida no escopo do módulo para evitar hoisting
const BONIFICACAO_TABLE: Array<[number, number]> = [
  [100, 500],
  [96, 400],
  [90, 300],
  [86, 200],
  [80, 100],
  [0, 0],
];

interface Atendente {
  id: number;
  nome: string;
  turno: string;
}

interface LancamentoPageProps {
  atendente: Atendente | null;
  producao: any;
  mediaDoTurno: number;
  onSubmit: (formData: any) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function LancamentoPage({
  atendente,
  producao,
  mediaDoTurno,
  onSubmit,
  onBack,
  isLoading = false,
}: LancamentoPageProps) {


  // Novo: lista de atendimentos individuais (como planilha)
  const [atendimentos, setAtendimentos] = useState([
    { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" },
  ]);

  // Totais agregados
  const [formData, setFormData] = useState({
    chatTotal: "",
    chatNota5: "",
    chatNota4: "",
    chatNota3: "",
    chatNota2: "",
    chatNota1: "",
    ligacaoTotal: "",
    ligacaoExtrementeSatisfeito: "",
    ligacaoExcelente: "",
    ligacaoBom: "",
    ligacaoRegular: "",
    ligacaoRuim: "",
    ligacaoPessimo: "",
  });

  // Load production data when component mounts
  // Ao carregar, carrega produção agregada OU reseta
  useEffect(() => {
    if (producao) {
      setFormData({
        chatTotal: producao.chatTotal.toString(),
        chatNota5: producao.chatNota5.toString(),
        chatNota4: producao.chatNota4.toString(),
        chatNota3: producao.chatNota3.toString(),
        chatNota2: producao.chatNota2.toString(),
        chatNota1: producao.chatNota1.toString(),
        ligacaoTotal: producao.ligacaoTotal.toString(),
        ligacaoExtrementeSatisfeito: producao.ligacaoExtrementeSatisfeito.toString(),
        ligacaoExcelente: producao.ligacaoExcelente.toString(),
        ligacaoBom: producao.ligacaoBom.toString(),
        ligacaoRegular: producao.ligacaoRegular.toString(),
        ligacaoRuim: producao.ligacaoRuim.toString(),
        ligacaoPessimo: producao.ligacaoPessimo.toString(),
      });
      // Se desejar, pode converter producao para atendimentos individuais
    } else {
      setFormData({
        chatTotal: "",
        chatNota5: "",
        chatNota4: "",
        chatNota3: "",
        chatNota2: "",
        chatNota1: "",
        ligacaoTotal: "",
        ligacaoExtrementeSatisfeito: "",
        ligacaoExcelente: "",
        ligacaoBom: "",
        ligacaoRegular: "",
        ligacaoRuim: "",
        ligacaoPessimo: "",
      });
      setAtendimentos([{ cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]);
    }
  }, [producao]);

  // Sempre que atendimentos mudam, recalcula totais agregados
  useEffect(() => {
    // Filtra só os válidos (retirarNota = false e que têm nota preenchida)
    const validos = atendimentos.filter(a => !a.retirarNota && a.nota && ["1", "2", "3", "4", "5"].includes(a.nota));
    // Chat
    const chat = validos.filter(a => a.tipo === "chat");
    const lig = validos.filter(a => a.tipo === "ligacao");
    setFormData({
      chatTotal: chat.length.toString(),
      chatNota5: chat.filter(a => a.nota === "5").length.toString(),
      chatNota4: chat.filter(a => a.nota === "4").length.toString(),
      chatNota3: chat.filter(a => a.nota === "3").length.toString(),
      chatNota2: chat.filter(a => a.nota === "2").length.toString(),
      chatNota1: chat.filter(a => a.nota === "1").length.toString(),
      ligacaoTotal: lig.length.toString(),
      ligacaoExtrementeSatisfeito: lig.filter(a => a.nota === "5").length.toString(),
      ligacaoExcelente: lig.filter(a => a.nota === "4").length.toString(),
      ligacaoBom: lig.filter(a => a.nota === "3").length.toString(),
      ligacaoRegular: lig.filter(a => a.nota === "2").length.toString(),
      ligacaoRuim: lig.filter(a => a.nota === "1").length.toString(),
      ligacaoPessimo: "0", // pode ser ajustado se necessário
    });
  }, [atendimentos]);

  const chatSum =
    (parseInt(formData.chatNota5) || 0) +
    (parseInt(formData.chatNota4) || 0) +
    (parseInt(formData.chatNota3) || 0) +
    (parseInt(formData.chatNota2) || 0) +
    (parseInt(formData.chatNota1) || 0);

  const ligacaoSum =
    (parseInt(formData.ligacaoExtrementeSatisfeito) || 0) +
    (parseInt(formData.ligacaoExcelente) || 0) +
    (parseInt(formData.ligacaoBom) || 0) +
    (parseInt(formData.ligacaoRegular) || 0) +
    (parseInt(formData.ligacaoRuim) || 0) +
    (parseInt(formData.ligacaoPessimo) || 0);

  const chatValidation = chatSum <= (parseInt(formData.chatTotal) || 0);
  const ligacaoValidation = ligacaoSum <= (parseInt(formData.ligacaoTotal) || 0);


  // Manipulação da tabela dinâmica
  const handleAtendimentoChange = (idx: number, field: string, value: any) => {
    setAtendimentos(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };
  const addAtendimento = () => setAtendimentos(prev => [...prev, { cliente: "", obs: "", nota: "", massiva: false, retirarNota: false, tipo: "chat" }]);
  const removeAtendimento = (idx: number) => setAtendimentos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (atendimentos.length === 0 || atendimentos.every(a => !a.nota)) {
      toast.error("Adicione pelo menos um atendimento");
      return;
    }
    onSubmit(formData);
  };

  // Calculate metrics
  const totalAtendimentos = (parseInt(formData.chatTotal as string) || 0) + (parseInt(formData.ligacaoTotal as string) || 0);

  const chatScore =
    (parseInt(formData.chatNota5 as string) || 0) * 5 +
    (parseInt(formData.chatNota4 as string) || 0) * 2 +
    (parseInt(formData.chatNota3 as string) || 0) * -3 +
    (parseInt(formData.chatNota2 as string) || 0) * -10 +
    (parseInt(formData.chatNota1 as string) || 0) * -10;

  const ligacaoScore =
    (parseInt(formData.ligacaoExtrementeSatisfeito as string) || 0) * 5 +
    (parseInt(formData.ligacaoExcelente as string) || 0) * 2 +
    (parseInt(formData.ligacaoBom as string) || 0) * 1 +
    (parseInt(formData.ligacaoRegular as string) || 0) * 0 +
    (parseInt(formData.ligacaoRuim as string) || 0) * -10 +
    (parseInt(formData.ligacaoPessimo as string) || 0) * -10;

  const totalScore = chatScore + ligacaoScore;

  const totalChatRatings =
    (parseInt(formData.chatNota5 as string) || 0) +
    (parseInt(formData.chatNota4 as string) || 0) +
    (parseInt(formData.chatNota3 as string) || 0) +
    (parseInt(formData.chatNota2 as string) || 0) +
    (parseInt(formData.chatNota1 as string) || 0);

  const totalLigacaoRatings =
    (parseInt(formData.ligacaoExtrementeSatisfeito as string) || 0) +
    (parseInt(formData.ligacaoExcelente as string) || 0) +
    (parseInt(formData.ligacaoBom as string) || 0) +
    (parseInt(formData.ligacaoRegular as string) || 0) +
    (parseInt(formData.ligacaoRuim as string) || 0) +
    (parseInt(formData.ligacaoPessimo as string) || 0);

  const maxScore = (totalChatRatings + totalLigacaoRatings) * 5;
  const performance = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const elegivel = totalAtendimentos >= mediaDoTurno && performance >= 80;

  // Calcula bonificação baseado na tabela
  let bonificacao = 0;
  for (const [perfMin, bonus] of BONIFICACAO_TABLE) {
    if (performance >= perfMin) {
      bonificacao = bonus;
      break;
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lançamento de Produção</h1>
          <p className="text-muted-foreground mt-1">
            {atendente ? `Atendente: ${atendente.nome} (Turno ${atendente.turno})` : ""}
          </p>
        </div>
        <Button
          onClick={onBack}
          className="bg-primary hover:bg-primary/90 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos Atendentes
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tabela dinâmica de atendimentos */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Atendimentos Individuais</h3>
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="border px-2">Cliente</th>
                <th className="border px-2">OBS</th>
                <th className="border px-2">Nota</th>
                <th className="border px-2">Tipo</th>
                <th className="border px-2">Massiva?</th>
                <th className="border px-2">Retirar Nota?</th>
                <th className="border px-2"></th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((a, idx) => (
                <tr key={idx}>
                  <td className="border px-2"><Input value={a.cliente} onChange={e => handleAtendimentoChange(idx, "cliente", e.target.value)} placeholder="Cliente" /></td>
                  <td className="border px-2"><Input value={a.obs} onChange={e => handleAtendimentoChange(idx, "obs", e.target.value)} placeholder="OBS" /></td>
                  <td className="border px-2">
                    <select value={a.nota} onChange={e => handleAtendimentoChange(idx, "nota", e.target.value)} className="w-16">
                      <option value="">-</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </td>
                  <td className="border px-2">
                    <select value={a.tipo} onChange={e => handleAtendimentoChange(idx, "tipo", e.target.value)} className="w-20">
                      <option value="chat">Chat</option>
                      <option value="ligacao">Ligação</option>
                    </select>
                  </td>
                  <td className="border px-2 text-center">
                    <input type="checkbox" checked={a.massiva} onChange={e => handleAtendimentoChange(idx, "massiva", e.target.checked)} />
                  </td>
                  <td className="border px-2 text-center">
                    <input type="checkbox" checked={a.retirarNota} onChange={e => handleAtendimentoChange(idx, "retirarNota", e.target.checked)} />
                  </td>
                  <td className="border px-2">
                    <Button size="sm" variant="ghost" onClick={() => removeAtendimento(idx)} disabled={atendimentos.length === 1}>Remover</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button size="sm" className="mt-2" onClick={addAtendimento}>Adicionar Atendimento</Button>
        </div>

        {/* Chat Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-xl">Atendimento por Chat</CardTitle>
                <CardDescription className="text-sm">Notas de 1 a 5 estrelas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Total de Atendimentos</label>
              <Input
                type="number"
                min="0"
                value={formData.chatTotal}
                onChange={(e) => handleInputChange("chatTotal", e.target.value)}
                className="bg-muted/50 border-border text-base h-10"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1">
                  <span>⭐⭐⭐⭐⭐</span> Nota 5 (+5)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.chatNota5}
                  onChange={(e) => handleInputChange("chatNota5", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1">
                  <span>⭐⭐⭐⭐</span> Nota 4 (+2)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.chatNota4}
                  onChange={(e) => handleInputChange("chatNota4", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1">
                  <span>⭐⭐⭐</span> Nota 3 (-3)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.chatNota3}
                  onChange={(e) => handleInputChange("chatNota3", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1">
                  <span>⭐⭐</span> Nota 2 (-10)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.chatNota2}
                  onChange={(e) => handleInputChange("chatNota2", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1">
                  <span>⭐</span> Nota 1 (-10)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.chatNota1}
                  onChange={(e) => handleInputChange("chatNota1", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
            </div>

            {!chatValidation && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500 text-sm">
                  A soma das notas não pode ser maior que o total de atendimentos
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Call Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-xl">Atendimento por Ligação</CardTitle>
                <CardDescription className="text-sm">Categorias de satisfação</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Total de Atendimentos</label>
              <Input
                type="number"
                min="0"
                value={formData.ligacaoTotal}
                onChange={(e) => handleInputChange("ligacaoTotal", e.target.value)}
                className="bg-muted/50 border-border text-base h-10"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Ext. Satisfeito (+5)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoExtrementeSatisfeito}
                  onChange={(e) => handleInputChange("ligacaoExtrementeSatisfeito", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Excelente (+2)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoExcelente}
                  onChange={(e) => handleInputChange("ligacaoExcelente", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Bom (+1)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoBom}
                  onChange={(e) => handleInputChange("ligacaoBom", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Regular (0)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoRegular}
                  onChange={(e) => handleInputChange("ligacaoRegular", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Ruim (-10)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoRuim}
                  onChange={(e) => handleInputChange("ligacaoRuim", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">Péssimo (-10)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.ligacaoPessimo}
                  onChange={(e) => handleInputChange("ligacaoPessimo", e.target.value)}
                  className="bg-muted/50 border-border text-base h-10"
                  placeholder="0"
                />
              </div>
            </div>

            {!ligacaoValidation && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500 text-sm">
                  A soma das categorias não pode ser maior que o total de atendimentos
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl">Resumo do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Total Atendimentos</p>
                <p className="text-3xl font-bold text-foreground">{totalAtendimentos}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Média do Turno</p>
                <p className="text-3xl font-bold text-foreground">{Math.round(mediaDoTurno)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pontuação Obtida</p>
                <p className="text-3xl font-bold text-foreground">{totalScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Pontuação Máxima</p>
                <p className="text-3xl font-bold text-foreground">{maxScore}</p>
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

            {!elegivel && (
              <Alert className="mt-6 bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-500">
                  Não Elegível • Performance abaixo de 80%
                </AlertDescription>
              </Alert>
            )}

            {elegivel && (
              <Alert className="mt-6 bg-green-500/10 border-green-500/50">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-500">
                  Elegível para bonificação
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-0 bg-background border-t border-border px-6 py-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="px-8 h-11"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-8 h-11"
        >
          {isLoading ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </div>
    </div>
  );
}