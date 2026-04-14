import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LancamentoAtendimento {
  cliente: string;
  obs: string;
  nota: string;
  massiva: boolean;
  retirarNota: boolean;
  tipo: "chat" | "ligacao";
}

interface LancamentoSemana {
  start: string | null;
  end: string | null;
  atendimentos: LancamentoAtendimento[];
}

interface LancamentoPDFButtonProps {
  atendenteId: number;
  atendenteName: string;
  mes: number;
  ano: number;
  mediaDoTurno: number;
  semanas: LancamentoSemana[];
  // Chat
  chatTotal: number;
  chatNota5: number;
  chatNota4: number;
  chatNota3: number;
  chatNota2: number;
  chatNota1: number;
  // Ligação
  ligacaoTotal: number;
  ligacaoExtrementeSatisfeito: number;
  ligacaoExcelente: number;
  ligacaoBom: number;
  ligacaoRegular: number;
  ligacaoRuim: number;
  ligacaoPessimo: number;
  // Performance
  performance: number;
  pontosTotais: number;
  bonificacao: number;
  elegivel: boolean;
}

export function LancamentoPDFButton({
  atendenteId,
  atendenteName,
  mes,
  ano,
  mediaDoTurno,
  semanas,
  chatTotal,
  chatNota5,
  chatNota4,
  chatNota3,
  chatNota2,
  chatNota1,
  ligacaoTotal,
  ligacaoExtrementeSatisfeito,
  ligacaoExcelente,
  ligacaoBom,
  ligacaoRegular,
  ligacaoRuim,
  ligacaoPessimo,
  performance,
  pontosTotais,
  bonificacao,
  elegivel,
}: LancamentoPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const exportMutation = trpc.export.lancamentoPDF.useMutation();

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const result = await exportMutation.mutateAsync({
        atendenteId,
        mes,
        ano,
        mediaDoTurno,
        semanas,
        chatTotal,
        chatNota5,
        chatNota4,
        chatNota3,
        chatNota2,
        chatNota1,
        ligacaoTotal,
        ligacaoExtrementeSatisfeito,
        ligacaoExcelente,
        ligacaoBom,
        ligacaoRegular,
        ligacaoRuim,
        ligacaoPessimo,
        performance,
        pontosTotais,
        bonificacao,
        elegivel,
      });

      try {
        const dataUrl = `data:application/pdf;base64,${result.buffer}`;
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Erro ao criar data URL para download:", err);
        const binaryString = atob(result.buffer);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Relatório de ${atendenteName} exportado com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      className="gap-2"
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isLoading ? "Gerando..." : "Exportar Relatório PDF"}
    </Button>
  );
}
