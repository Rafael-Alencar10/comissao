import React, { createContext, useContext, useEffect, useState } from "react";
import { THEME_PRESETS, ThemePreset } from "@/constants/themes";

export interface CustomColors {
  primary: string;
  accent: string;
}

const DEFAULT_COLORS: CustomColors = {
  primary: "#2a6f97",
  accent: "#2a6f97",
};

interface ColorContextType {
  colors: CustomColors;
  setColors: (colors: CustomColors) => void;
  resetColors: () => void;
  applyThemePreset: (presetName: string) => void;
  currentTheme: string | null;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<CustomColors>(DEFAULT_COLORS);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem("customColors");
    const savedTheme = localStorage.getItem("currentTheme");
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        setColorsState(parsed);
        applyColors(parsed);
      } catch (e) {
        console.error("Failed to parse saved colors:", e);
        applyColors(DEFAULT_COLORS);
      }
    } else {
      applyColors(DEFAULT_COLORS);
    }
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  const applyColors = (newColors: CustomColors) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", newColors.primary);
    root.style.setProperty("--primary-foreground", "#FFFFFF");
    root.style.setProperty("--sidebar-primary", newColors.primary);
    root.style.setProperty("--sidebar-primary-foreground", "#FFFFFF");
    root.style.setProperty("--accent", newColors.accent);
    root.style.setProperty("--accent-foreground", "#FFFFFF");
  };

  const setColors = (newColors: CustomColors) => {
    setColorsState(newColors);
    applyColors(newColors);
    localStorage.setItem("customColors", JSON.stringify(newColors));
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
    setCurrentTheme(null);
    localStorage.removeItem("currentTheme");
  };

  const applyThemePreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setColors({ primary: preset.primary, accent: preset.accent });
      setCurrentTheme(presetName);
      localStorage.setItem("currentTheme", presetName);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ColorContext.Provider value={{ colors, setColors, resetColors, applyThemePreset, currentTheme }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColors() {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColors must be used within ColorProvider");
  }
  return context;
}

export function useThemePresets() {
  return THEME_PRESETS;
}
