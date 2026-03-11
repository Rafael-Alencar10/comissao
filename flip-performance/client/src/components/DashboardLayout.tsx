import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, ClipboardList, DollarSign, Eye, BarChart3, Palette, ChevronRight, Bug } from "lucide-react";
import { AtendentIcon } from "./icons/AtendentIcon";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { NotificationsPanel } from "./NotificationsPanel";

import { Settings } from "lucide-react";


const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: AtendentIcon, label: "Atendentes", path: "/atendentes" },
  { icon: Eye, label: "Visão Turno", path: "/visao-turno" },
  { icon: ClipboardList, label: "Lançamento", path: "/lancamento" },
  { icon: ClipboardList, label: "Histórico", path: "/historico" },
  { icon: DollarSign, label: "Comissões", path: "/comissoes" },
  { icon: BarChart3, label: "Performance", path: "/performance" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 180;
const MAX_WIDTH = 380;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r"
          style={{ backgroundColor: '#0F1426', borderRightColor: '#1E293B' }}
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-32 justify-center items-center py-4" style={{ backgroundColor: '#0F1426' }}>
            <div className="flex items-center justify-center gap-2 px-2 transition-all w-full">
              {!isCollapsed ? (
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663107534228/ncGGTomvPfOuqTvT.png"
                  alt="Flip Performance"
                  className="h-24 w-auto object-contain"
                />
              ) : (
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-4" style={{ backgroundColor: '#0F1426' }}>
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal px-4 py-2 rounded-lg"
                      style={isActive ? {
                        background: 'linear-gradient(90deg, #2B6CFF 0%, #1E40AF 100%)',
                        boxShadow: '0 4px 14px 0 rgba(43, 108, 255, 0.35)',
                        color: 'white'
                      } : {
                        color: 'rgb(148, 163, 184)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.backgroundColor = 'rgba(43, 108, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = 'rgb(148, 163, 184)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3" style={{ backgroundColor: '#0F1426' }}>
            <div className="mt-4 px-2">
              <div className="flex items-center gap-3 py-2">
                {/* Aumentamos a altura para h-10 (40px) para dar mais nitidez */}
                <img
                  src="/arelph-logo.png"
                  alt="Arelph - Sistemas de gestão"
                  className="h-10 w-auto object-contain shrink-0"
                  style={{ imageRendering: 'crisp-edges' }}
                />

                {/* Alinhamento vertical centralizado e texto um pouco maior */}
                <div className="flex flex-col justify-center group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-semibold text-sidebar-foreground/80 leading-tight">
                    ARELPH
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/60 leading-tight">
                    Sistemas de gestão
                  </span>
                </div>
              </div>
            </div>

          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            {isMobile && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-background hover:bg-accent flex items-center justify-center transition-colors p-0 overflow-hidden">
                  <img src="/flip-internet-veloz.png" alt="Flip internet veloz" className="h-9 w-9 object-cover rounded-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={logout}
                  className="flex flex-col items-center py-3 cursor-pointer text-destructive focus:text-destructive"
                >
                  {user && user.username && (
                    <span className="mb-1 font-semibold text-primary text-sm">{user.username}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-destructive">Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <main className="flex-1 p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
