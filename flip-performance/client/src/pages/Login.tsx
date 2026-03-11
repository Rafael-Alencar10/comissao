import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      // Store auth token/session
      localStorage.setItem("user", JSON.stringify(data));

      // Invalidate and refetch the me query to update auth state
      // Wait for the refetch to complete before redirecting
      await utils.auth.me.invalidate();
      const result = await utils.auth.me.fetch();

      if (result) {
        // User data is now available, safe to redirect
        toast.success("Login realizado com sucesso!");
        setLocation("/");
      }
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Digite seu usuário");
      return;
    }

    if (!password.trim()) {
      setError("Digite sua senha");
      return;
    }

    loginMutation.mutate({ username, password });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-start p-4 overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        src="/background-earth.mp4"
      />
      {/* Overlay for darkening if needed */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/80 z-10" />
      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md ml-8 md:ml-16 lg:ml-32">
        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663107534228/ncGGTomvPfOuqTvT.png" alt="Flip Performance" className="h-32 w-auto object-contain" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Usuário
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border"
                  disabled={loginMutation.isPending}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border"
                  disabled={loginMutation.isPending}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-10"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Desenvolvido por: <a href="https://arelph.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Arelph - Sistemas de gestão</a></p>
              <div className="flex justify-center mt-2">
                <img src="/arelph-logo.png" alt="Arelph - Sistemas de gestão" className="w-16 h-16 object-contain" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
