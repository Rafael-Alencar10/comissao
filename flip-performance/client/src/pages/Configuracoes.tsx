import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Settings, Plus, Trash2, Edit2, AlertCircle, CheckCircle, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user" as "user" | "admin",
  });

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const listUsersQuery = trpc.auth.listUsers.useQuery(undefined, {
    enabled: isAdmin,
  });

  const createUserMutation = trpc.auth.createUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      setFormData({ username: "", password: "", role: "user" });
      setIsCreateDialogOpen(false);
      listUsersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = trpc.auth.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      setIsEditDialogOpen(false);
      listUsersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.auth.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso!");
      listUsersQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateUser = () => {
    if (!formData.username.trim()) {
      toast.error("Digite um usuário");
      return;
    }
    if (!formData.password.trim()) {
      toast.error("Digite uma senha");
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    const updateData: any = {
      id: editingUser.id,
      role: formData.role,
    };

    if (formData.username !== editingUser.username) {
      updateData.username = formData.username;
    }

    if (formData.password) {
      updateData.password = formData.password;
    }

    updateUserMutation.mutate(updateData);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas preferências do sistema</p>
        </div>

        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            Apenas administradores podem acessar todas as configurações do sistema
          </AlertDescription>
        </Alert>

        {/* Theme Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tema do Sistema
            </CardTitle>
            <CardDescription>Personalize a aparência do aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => {
                  if (theme !== "light") toggleTheme?.();
                }}
                className="gap-2"
              >
                <Sun className="h-4 w-4" />
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => {
                  if (theme !== "dark") toggleTheme?.();
                }}
                className="gap-2"
              >
                <Moon className="h-4 w-4" />
                Escuro
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Tema atual: <span className="font-semibold capitalize">{theme}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuários, permissões e preferências do sistema
        </p>
      </div>

      {/* Theme Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tema do Sistema
          </CardTitle>
          <CardDescription>Personalize a aparência do aplicativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => {
                if (theme !== "light") toggleTheme?.();
              }}
              className="gap-2"
            >
              <Sun className="h-4 w-4" />
              Claro
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => {
                if (theme !== "dark") toggleTheme?.();
              }}
              className="gap-2"
            >
              <Moon className="h-4 w-4" />
              Escuro
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Tema atual: <span className="font-semibold capitalize">{theme}</span>
          </p>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>Crie, edite ou desative usuários do sistema</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setFormData({ username: "", password: "", role: "user" })}>
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao sistema com suas permissões
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Usuário</label>
                  <Input
                    placeholder="Digite o nome de usuário"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Input
                    type="password"
                    placeholder="Digite a senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Função</label>
                  <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === "user" && (
                  <div className="space-y-2 border border-border rounded p-3">
                    <label className="text-sm font-semibold text-foreground">Permissões de acesso</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.atendentes} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, atendentes: e.target.checked } })} />
                        Atendentes
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.dashboard} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, dashboard: e.target.checked } })} />
                        Dashboard
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.visaoTurno} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, visaoTurno: e.target.checked } })} />
                        Visão Turno
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.lancamento} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, lancamento: e.target.checked } })} />
                        Lançamento
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.historico} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, historico: e.target.checked } })} />
                        Histórico
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.comissoes} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, comissoes: e.target.checked } })} />
                        Comissões
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.performance} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, performance: e.target.checked } })} />
                        Performance
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.permissoes?.configuracoes} onChange={e => setFormData({ ...formData, permissoes: { ...formData.permissoes, configuracoes: e.target.checked } })} />
                        Configurações
                      </label>
                    </div>
                    <label className="text-sm font-semibold text-foreground mt-2">Tema do sistema</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="tema" value="claro" checked={formData.tema === "claro"} onChange={() => setFormData({ ...formData, tema: "claro" })} />
                        Claro
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="tema" value="escuro" checked={formData.tema === "escuro"} onChange={() => setFormData({ ...formData, tema: "escuro" })} />
                        Escuro
                      </label>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {listUsersQuery.isLoading ? (
            <p className="text-center text-muted-foreground py-4">Carregando usuários...</p>
          ) : listUsersQuery.data && listUsersQuery.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-foreground">Usuário</TableHead>
                    <TableHead className="text-foreground">Função</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Criado em</TableHead>
                    <TableHead className="text-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listUsersQuery.data.map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.role === "admin" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-blue-500/10 text-blue-400 border-blue-500/30"}
                        >
                          {user.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.status === "ativo" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}
                        >
                          {user.status === "ativo" ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-400 hover:bg-blue-500/10"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-background border-border">
                              <DialogHeader>
                                <DialogTitle>Editar Usuário</DialogTitle>
                                <DialogDescription>Atualize as informações do usuário</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Usuário</label>
                                  <Input
                                    placeholder="Digite o novo nome de usuário"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="bg-background border-border"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Senha (deixe em branco para manter)</label>
                                  <Input
                                    type="password"
                                    placeholder="Digite a nova senha"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-background border-border"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">Função</label>
                                  <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger className="bg-background border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">Usuário</SelectItem>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Button
                                  onClick={handleUpdateUser}
                                  disabled={updateUserMutation.isPending}
                                  className="w-full"
                                >
                                  {updateUserMutation.isPending ? "Atualizando..." : "Atualizar Usuário"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja deletar o usuário ${user.username}?`)) {
                                deleteUserMutation.mutate({ id: user.id });
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
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
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhum usuário encontrado</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
