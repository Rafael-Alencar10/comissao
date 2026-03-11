import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Atendente {
  id: number;
  nome: string;
  turno: string;
  status: string;
}

interface AtendentesGridProps {
  atendentes: Atendente[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  completedIds: number[];
  isLoading?: boolean;
}

export function AtendentesGrid({
  atendentes,
  selectedId,
  onSelect,
  completedIds,
  isLoading = false,
}: AtendentesGridProps) {
  const turnoOrder = ["A", "B", "C"];

  const activeAtendentes = [...atendentes]
    .filter((a) => a.status === "Ativo")
    .sort((x, y) => {
      const ix = turnoOrder.indexOf(x.turno as string);
      const iy = turnoOrder.indexOf(y.turno as string);
      if (ix !== iy) return ix - iy;
      return x.nome.localeCompare(y.nome);
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Selecione um Atendente</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {completedIds.length} de {activeAtendentes.length} lançamentos concluídos
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
            <span className="text-muted-foreground">Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500/20 border border-slate-400"></div>
            <span className="text-muted-foreground">Pendente</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {activeAtendentes.map((atendente) => {
          const isCompleted = completedIds.includes(atendente.id);
          const isSelected = selectedId === atendente.id;

          return (
            <button
              key={atendente.id}
              onClick={() => onSelect(atendente.id)}
              disabled={isLoading}
              className={cn(
                "relative group overflow-hidden rounded-lg p-4 transition-all duration-200 cursor-pointer",
                "border-2 backdrop-blur-sm",
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                  : isCompleted
                    ? "border-green-500/50 bg-green-500/5 hover:border-green-500 hover:bg-green-500/10"
                    : "border-slate-400/30 bg-slate-500/5 hover:border-slate-400/60 hover:bg-slate-500/10",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {/* Background gradient effect */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  isCompleted ? "bg-gradient-to-br from-green-500/10 to-transparent" : "bg-gradient-to-br from-blue-500/10 to-transparent"
                )}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                {/* Status Icon */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                      isCompleted
                        ? "bg-green-500/20 border border-green-500"
                        : isSelected
                          ? "bg-blue-500/20 border border-blue-500"
                          : "bg-slate-500/20 border border-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[80px]">
                    {atendente.nome.split(" ")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">Turno {atendente.turno}</p>
                </div>

                {/* Status Badge */}
                <div
                  className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap",
                    isCompleted
                      ? "bg-green-500/20 text-green-400"
                      : isSelected
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-slate-500/20 text-slate-300"
                  )}
                >
                  {isCompleted ? "✓ Feito" : "Pendente"}
                </div>
              </div>

              {/* Hover effect border */}
              <div
                className={cn(
                  "absolute inset-0 rounded-lg pointer-events-none transition-all duration-200",
                  isSelected ? "ring-2 ring-blue-500/50" : "group-hover:ring-1 group-hover:ring-slate-400/50"
                )}
              />
            </button>
          );
        })}
      </div>

      {activeAtendentes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum atendente ativo disponível</p>
        </div>
      )}
    </div>
  );
}
