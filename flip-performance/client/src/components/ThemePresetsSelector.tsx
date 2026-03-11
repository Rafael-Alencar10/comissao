import { useColors, useThemePresets } from "@/contexts/ColorContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

export function ThemePresetsSelector() {
  const { applyThemePreset, currentTheme } = useColors();
  const presets = useThemePresets();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Temas Predefinidos</Label>
      <div className="grid grid-cols-1 gap-2">
        {Object.values(presets).map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyThemePreset(preset.name)}
            className={`relative w-full px-3 py-2 rounded-lg border-2 transition-all text-left ${ 
              currentTheme === preset.name
                ? "border-foreground bg-accent/10"
                : "border-border hover:border-foreground/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">{preset.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {preset.description}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: preset.primary }}
                  title="Cor Primária"
                />
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: preset.accent }}
                  title="Cor de Destaque"
                />
              </div>
              {currentTheme === preset.name && (
                <Check className="w-4 h-4 ml-2 text-accent" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
