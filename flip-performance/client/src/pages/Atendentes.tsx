import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit2, Search, ChevronDown, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Atendentes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTurno, setFilterTurno] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    turno: "A" as const,
    tipoAtuacao: "Ambos" as const,
    status: "Ativo" as const,
    tolerancia: 0,
  });

  const [mesTolerancia, setMesTolerancia] = useState(new Date().getMonth() + 1);
  const [anoTolerancia, setAnoTolerancia] = useState(new Date().getFullYear());
  const [toleranciaMensalVal, setToleranciaMensalVal] = useState<number>(0);
  const [justificativaMensalVal, setJustificativaMensalVal] = useState("");

  const atendentesQuery = trpc.atendentes.list.useQuery();
  const { data: toleranciasDoMes = [] } = trpc.toleranciaMensal.getByMesAno.useQuery(
    { mes: mesTolerancia, ano: anoTolerancia },
    { enabled: !!editingId }
  );
  const utils = trpc.useUtils();
  const upsertToleranciaMutation = trpc.toleranciaMensal.upsert.useMutation({
    onSuccess: () => {
      utils.toleranciaMensal.getByMesAno.invalidate({ mes: mesTolerancia, ano: anoTolerancia });
      toast.success("Tolerância do mês salva");
    },
    onError: (err) => toast.error(err.message),
  });
  const createMutation = trpc.atendentes.create.useMutation({
    onSuccess: () => {
      atendentesQuery.refetch();
      setFormData({ nome: "", turno: "A", tipoAtuacao: "Ambos", status: "Ativo", tolerancia: 0 });
      setIsDialogOpen(false);
      toast.success("Atendente criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.atendentes.update.useMutation({
    onSuccess: () => {
      atendentesQuery.refetch();
      setFormData({ nome: "", turno: "A", tipoAtuacao: "Ambos", status: "Ativo", tolerancia: 0 });
      setEditingId(null);
      setIsDialogOpen(false);
      toast.success("Atendente atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.atendentes.delete.useMutation({
    onSuccess: () => {
      atendentesQuery.refetch();
      toast.success("Atendente deletado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const recalcularMutation = trpc.producao.recalcularProducaoAtendente.useMutation({
    onSuccess: (result) => {
      toast.success(`Produção recalculada com sucesso! ${result.updatedCount} registros atualizados.`);
    },
    onError: (error) => {
      toast.error(`Erro ao recalcular: ${error.message}`);
    },
  });

  const atendentes = atendentesQuery.data || [];

  const filteredAtendentes = atendentes
    .filter((a) => {
      const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTurno = !filterTurno || a.turno === filterTurno;
      const matchesStatus = !filterStatus || a.status === filterStatus;
      return matchesSearch && matchesTurno && matchesStatus;
    })
    .sort((a, b) => {
      const turnoOrder: Record<string, number> = { A: 0, B: 1, C: 2 };
      const turnoA = turnoOrder[a.turno] ?? 999;
      const turnoB = turnoOrder[b.turno] ?? 999;
      if (turnoA !== turnoB) return turnoA - turnoB;
      return a.nome.localeCompare(b.nome);
    });

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const dataToSend = {
      ...formData,
      tolerancia: typeof formData.tolerancia === "string" ? parseFloat(formData.tolerancia) || 0 : Number(formData.tolerancia) || 0,
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: dataToSend,
      });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleEdit = (atendente: any) => {
    setFormData({
      ...atendente,
      tolerancia: typeof atendente.tolerancia === "string" ? parseFloat(atendente.tolerancia) || 0 : Number(atendente.tolerancia) || 0,
    });
    setEditingId(atendente.id);
    setMesTolerancia(new Date().getMonth() + 1);
    setAnoTolerancia(new Date().getFullYear());
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (editingId && toleranciasDoMes.length >= 0) {
      const rec = toleranciasDoMes.find((t) => t.atendenteId === editingId);
      setToleranciaMensalVal(rec?.tolerancia ?? 0);
      setJustificativaMensalVal(rec?.justificativaToleranciaAlta ?? "");
    }
  }, [editingId, toleranciasDoMes]);

  const handleSalvarToleranciaMes = () => {
    if (!editingId) return;
    if (toleranciaMensalVal > 5 && !justificativaMensalVal.trim()) {
      toast.error("Tolerância maior que 5% exige justificativa.");
      return;
    }
    upsertToleranciaMutation.mutate({
      atendenteId: editingId,
      mes: mesTolerancia,
      ano: anoTolerancia,
      tolerancia: toleranciaMensalVal,
      justificativaToleranciaAlta: justificativaMensalVal.trim() || null,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este atendente?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Atendentes</h1>
          <p className="text-muted-foreground mt-1">Cadastro e gerenciamento de atendentes</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ nome: "", turno: "A", tipoAtuacao: "Ambos", status: "Ativo", tolerancia: 0 });
            setEditingId(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Atendente
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'rgb(148, 163, 184)' }} />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 text-sm border rounded-md bg-popover border-border text-foreground"
              />
            </div>

            {/* Turno Dropdown */}
            <Select value={filterTurno || "all"} onValueChange={(v) => setFilterTurno(v === "all" ? null : v)}>
              <SelectTrigger className="w-auto py-2 text-sm rounded-md border flex items-center gap-2 bg-popover border-border text-foreground">
                <SelectValue placeholder="Todos os Turnos" />
                <ChevronDown className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Turnos</SelectItem>
                <SelectItem value="A">Turno A</SelectItem>
                <SelectItem value="B">Turno B</SelectItem>
                <SelectItem value="C">Turno C</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Dropdown */}
            <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}>
              <SelectTrigger className="w-auto py-2 text-sm rounded-md border flex items-center gap-2 bg-popover border-border text-foreground">
                <SelectValue placeholder="Status" />
                <ChevronDown className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b" style={{ borderColor: 'rgb(30, 41, 59)' }}>
                  <TableHead className="font-bold text-xs py-4 px-4" style={{ color: 'rgb(148, 163, 184)' }}>Nome</TableHead>
                  <TableHead className="font-bold text-xs py-4 px-4" style={{ color: 'rgb(148, 163, 184)' }}>Turno</TableHead>
                  <TableHead className="font-bold text-xs py-4 px-4" style={{ color: 'rgb(148, 163, 184)' }}>Tipo de Atuação</TableHead>
                  <TableHead className="font-bold text-xs py-4 px-4" style={{ color: 'rgb(148, 163, 184)' }}>Status</TableHead>
                  <TableHead className="font-bold text-xs py-4 px-4 text-right" style={{ color: 'rgb(148, 163, 184)' }}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtendentes.map((atendente, idx) => (
                  <TableRow
                    key={atendente.id}
                    className={`transition-colors text-foreground ${idx % 2 === 1 ? 'bg-muted' : ''}`}
                    style={{ height: '64px', borderColor: 'var(--border)', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => {
                      if (document.documentElement.classList.contains('light')) {
                        e.currentTarget.classList.add('bg-secondary');
                      } else {
                        e.currentTarget.classList.add('bg-primary/10');
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.classList.remove('bg-secondary');
                      e.currentTarget.classList.remove('bg-primary/10');
                    }}
                  >
                    <TableCell className="font-medium px-4 py-0">{atendente.nome}</TableCell>
                    <TableCell className="px-4 py-0">
                      <Badge variant="outline" className={`text-xs font-medium ${atendente.turno === 'C' ? 'border-0' : atendente.turno === 'B' ? 'border-0' : 'border-0'
                        }`} style={{
                          backgroundColor: atendente.turno === 'C' ? 'rgba(139, 92, 246, 0.2)' : atendente.turno === 'B' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                          color: atendente.turno === 'C' ? 'rgb(167, 139, 250)' : atendente.turno === 'B' ? 'rgb(45, 212, 191)' : 'rgb(96, 165, 250)'
                        }}>
                        Turno {atendente.turno}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-0" style={{ color: 'rgb(255, 255, 255)' }}>{atendente.tipoAtuacao}</TableCell>
                    <TableCell className="px-4 py-0">
                      <Badge
                        variant="outline"
                        className="text-xs font-medium border-0"
                        style={{
                          backgroundColor: atendente.status === "Ativo" ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: atendente.status === "Ativo" ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)'
                        }}
                      >
                        {atendente.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-4 py-0">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(atendente)}
                          className="hover:bg-primary/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(atendente.id)}
                          className="hover:bg-destructive/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Atendente" : "Novo Atendente"}</DialogTitle>
            <DialogDescription>Preencha os dados do atendente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nome</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                className="mt-1 bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Turno</label>
                <Select value={formData.turno} onValueChange={(v) => setFormData({ ...formData, turno: v as any })}>
                  <SelectTrigger className="mt-1 bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Turno A</SelectItem>
                    <SelectItem value="B">Turno B</SelectItem>
                    <SelectItem value="C">Turno C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tipo de Atuação</label>
                <Select value={formData.tipoAtuacao} onValueChange={(v) => setFormData({ ...formData, tipoAtuacao: v as any })}>
                  <SelectTrigger className="mt-1 bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chat">Chat</SelectItem>
                    <SelectItem value="Ligacao">Ligação</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="mt-1 bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tolerância padrão (%)</label>
              <div className="text-xs text-muted-foreground mb-1">Usada quando não há tolerância definida para um mês específico.</div>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tolerancia || ""}
                onChange={(e) => setFormData({ ...formData, tolerancia: e.target.value ? parseFloat(e.target.value) : 0 })}
                placeholder="0"
                className="mt-1 bg-muted border-border"
              />
            </div>
            {editingId && (
              <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Tolerância para o mês</span>
                </div>
                <p className="text-xs text-muted-foreground">Defina a tolerância que vale apenas para um mês específico. Se &gt; 5%, justificativa é obrigatória.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Mês</label>
                    <Select value={mesTolerancia.toString()} onValueChange={(v) => setMesTolerancia(parseInt(v))}>
                      <SelectTrigger className="mt-1 h-9 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {format(new Date(anoTolerancia, m - 1), "MMMM", { locale: ptBR })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Ano</label>
                    <Select value={anoTolerancia.toString()} onValueChange={(v) => setAnoTolerancia(parseInt(v))}>
                      <SelectTrigger className="mt-1 h-9 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tolerância (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={toleranciaMensalVal || ""}
                    onChange={(e) => setToleranciaMensalVal(e.target.value ? parseFloat(e.target.value) : 0)}
                    className="mt-1 h-9 bg-background border-border"
                  />
                </div>
                {toleranciaMensalVal > 5 && (
                  <div>
                    <label className="text-xs text-muted-foreground">Justificativa <span className="text-amber-500">(obrigatória)</span></label>
                    <Textarea
                      placeholder="Ex: Afastamento médico, treinamento..."
                      value={justificativaMensalVal}
                      onChange={(e) => setJustificativaMensalVal(e.target.value)}
                      rows={2}
                      className="mt-1 bg-background border-border text-sm"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSalvarToleranciaMes}
                  disabled={upsertToleranciaMutation.isPending || (toleranciaMensalVal > 5 && !justificativaMensalVal.trim())}
                  className="border-border"
                >
                  {upsertToleranciaMutation.isPending ? "Salvando..." : `Salvar para ${format(new Date(anoTolerancia, mesTolerancia - 1), "MMMM/yyyy", { locale: ptBR })}`}
                </Button>
              </div>
            )}
            {editingId && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Isso irá recalcular todas as produções históricas deste atendente com a nova tolerância. Deseja continuar?")) {
                      recalcularMutation.mutate({ atendenteId: editingId });
                    }
                  }}
                  disabled={recalcularMutation.isLoading}
                  className="w-full border-border"
                >
                  {recalcularMutation.isLoading ? "Recalculando..." : "Recalcular Produção Histórica"}
                </Button>
                <div className="text-xs text-muted-foreground mt-1">
                  Use isso após alterar a tolerância para atualizar dados antigos.
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                {editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
