import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportPDFButtonProps {
  mes: number;
  ano: number;
  turno?: string;
  atendenteId?: number;
}

export function ExportPDFButton({
  mes,
  ano,
  turno,
  atendenteId,
}: ExportPDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const exportMutation = trpc.export.producaoPDF.useMutation();

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const result = await exportMutation.mutateAsync({
        mes,
        ano,
        turno: turno as "A" | "B" | "C" | undefined,
        atendenteId,
      });

      // Create data URL directly from base64 to avoid binary conversion issues
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
        // Fallback: try previous method (atob -> blob)
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

      toast.success("Relatório exportado com sucesso!");
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
      {isLoading ? "Gerando..." : "Exportar PDF"}
    </Button>
  );
}
