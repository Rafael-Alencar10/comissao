import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { AtendentesGrid } from "@/components/AtendentesGrid";
// CORREÇÃO: A importação de LancamentoPage deve ser default (sem chaves)
import { LancamentoPage } from "@/components/LancamentoPage";

export default function Lancamento() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [atendenteId, setAtendenteId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const utils = trpc.useUtils(); // Contexto do tRPC para invalidação

  const atendentesQuery = trpc.atendentes.list.useQuery();
  const completedQuery = trpc.producao.getCompletedAtendentes.useQuery({ mes, ano });
  const producaoQuery = trpc.producao.getByAtendente.useQuery(
    { atendenteId: atendenteId || 0, mes, ano },
    { enabled: !!atendenteId && isModalOpen }
  );

  const atendente = (atendentesQuery.data || []).find((a) => a.id === atendenteId);

  // Busca os atendimentos detalhados salvos (se existir producao.id)
  const atendimentosDetalhados = trpc.producao.getAtendimentosDetalhados.useQuery(
    { producaoMensalId: producaoQuery.data?.id || 0 },
    { enabled: !!producaoQuery.data?.id }
  );

  const producaoTurnoQuery = trpc.producao.getByTurnoMesAno.useQuery(
    { turno: (atendente?.turno as "A" | "B" | "C") || "A", mes, ano },
    { enabled: !!atendente && isModalOpen }
  );

  const onMutationSuccess = () => {
    // Invalida o cache de todas as queries de 'producao' para garantir que a UI atualize
    utils.producao.invalidate();
    setIsModalOpen(false);
    setAtendenteId(null);
  };

  const updateMutation = trpc.producao.update.useMutation({
    onSuccess: () => {
      toast.success("Produção atualizada com sucesso");
      onMutationSuccess();
    },
    onError: (error) => toast.error(`Erro ao atualizar: ${error.message}`),
  });

  const createMutation = trpc.producao.create.useMutation({
    onSuccess: () => {
      toast.success("Produção lançada com sucesso");
      onMutationSuccess();
    },
    onError: (error) => toast.error(`Erro ao criar: ${error.message}`),
  });

  const producao = producaoQuery.data;

  const producoesTurno = producaoTurnoQuery.data || [];
  const totalAtendimentosTurno = producoesTurno.reduce((sum, p) => sum + (p.chatTotal || 0) + (p.ligacaoTotal || 0), 0);
  const mediaDoTurno = producoesTurno.length > 0 ? totalAtendimentosTurno / producoesTurno.length : 0;

  const handleAttendenteSelect = (id: number) => {
    setAtendenteId(id);
    setIsModalOpen(true);
  };

  // ==================================================================
  // =================== ÁREA DA CORREÇÃO PRINCIPAL ===================
  // ==================================================================
  const handleModalSubmit = (formData: any) => {
    if (!atendenteId) {
      toast.error("Selecione um atendente");
      return;
    }

    // debug logs removed for production

    // O `formData` agora contém a estrutura completa, incluindo `historicoAtendimentos` (semanas).
    // O backend deve ser responsável por calcular os totais a partir dos dados brutos.
    const prodData = {
      atendenteId,
      mes,
      ano,

      // CORREÇÃO: Passando o campo 'semanas' (vem como historicoAtendimentos do LancamentoPage)
      // O seu schema já tem o campo `semanas: json("semanas")`, então isso funcionará.
      semanas: formData.historicoAtendimentos || [],

      // Os totais calculados no frontend são enviados para o backend salvar.
      // O ideal é o backend recalcular, mas enviar assim também funciona.
      chatTotal: parseInt(formData.chatTotal) || 0,
      chatNota5: parseInt(formData.chatNota5) || 0,
      chatNota4: parseInt(formData.chatNota4) || 0,
      chatNota3: parseInt(formData.chatNota3) || 0,
      chatNota2: parseInt(formData.chatNota2) || 0,
      chatNota1: parseInt(formData.chatNota1) || 0,
      chatSemNota: parseInt(formData.chatSemNota) || 0,
      ligacaoTotal: parseInt(formData.ligacaoTotal) || 0,
      ligacaoExtrementeSatisfeito: parseInt(formData.ligacaoExtrementeSatisfeito) || 0,
      ligacaoExcelente: parseInt(formData.ligacaoExcelente) || 0,
      ligacaoBom: parseInt(formData.ligacaoBom) || 0,
      ligacaoRegular: parseInt(formData.ligacaoRegular) || 0,
      ligacaoRuim: parseInt(formData.ligacaoRuim) || 0,
      ligacaoPessimo: parseInt(formData.ligacaoPessimo) || 0,
    };

    // end debug

    if (producao && producao.id) {
      updateMutation.mutate({ id: producao.id, data: prodData });
    } else {
      createMutation.mutate(prodData);
    }
  };

  return (
    <>
      {atendenteId && isModalOpen ? (
        <LancamentoPage
          atendente={atendente || null}
          producao={producao}
          mediaDoTurno={mediaDoTurno}
          onSubmit={handleModalSubmit}
          onBack={() => {
            setIsModalOpen(false);
            setAtendenteId(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          atendimentosDetalhados={atendimentosDetalhados.data || []}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lançamento de Produção</h1>
              <p className="text-muted-foreground mt-1">Registre a produção mensal dos atendentes</p>
            </div>
            <div className="bg-card border border-border rounded-lg flex items-center gap-4 p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(ano, i).toLocaleDateString("pt-BR", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((a) => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <AtendentesGrid
                atendentes={atendentesQuery.data || []}
                selectedId={atendenteId}
                onSelect={handleAttendenteSelect}
                completedIds={completedQuery.data || []}
                isLoading={atendentesQuery.isLoading || completedQuery.isLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
