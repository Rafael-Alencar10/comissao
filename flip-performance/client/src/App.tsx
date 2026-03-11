import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";

import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Atendentes from "./pages/Atendentes";
import Lancamento from "./pages/Lancamento";
import Comissoes from "./pages/Comissoes";
import VisaoTurno from "./pages/VisaoTurno";
import Historico from "./pages/Historico";
import Performance from "./pages/Performance";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user && location !== "/login") {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
          <p className="text-muted-foreground">Verificando autenticação</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar apenas login
  if (!user) {
    // Se está em uma rota protegida, mostrar loading enquanto redireciona
    if (location !== "/login") {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Redirecionando...</h2>
            <p className="text-muted-foreground">Você será redirecionado para login</p>
          </div>
        </div>
      );
    }

    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="*" component={Login} />
      </Switch>
    );
  }

  // Se está autenticado, mostrar dashboard e outras rotas
  return (
    <Switch>
      <Route path="/" component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/atendentes" component={() => <DashboardLayout><Atendentes /></DashboardLayout>} />
      <Route path="/lancamento" component={() => <DashboardLayout><Lancamento /></DashboardLayout>} />
      <Route path="/visao-turno" component={() => <DashboardLayout><VisaoTurno /></DashboardLayout>} />
      <Route path="/historico" component={() => <DashboardLayout><Historico /></DashboardLayout>} />
      <Route path="/comissoes" component={() => <DashboardLayout><Comissoes /></DashboardLayout>} />
      <Route path="/performance" component={() => <DashboardLayout><Performance /></DashboardLayout>} />
      <Route path="/configuracoes" component={() => <DashboardLayout><Configuracoes /></DashboardLayout>} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
