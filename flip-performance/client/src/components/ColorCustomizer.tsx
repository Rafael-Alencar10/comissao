import { useColors } from "@/contexts/ColorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { ThemePresetsSelector } from "./ThemePresetsSelector";

const PRESET_COLORS = [
  { name: "Rich Cerulean", value: "#2a6f97" },
  { name: "Cerulean", value: "#2c7da0" },
  { name: "Blue Green", value: "#468faf" },
  { name: "Pacific Blue", value: "#61a5c2" },
  { name: "Sky Blue", value: "#89c2d9" },
  { name: "Emerald", value: "#059669" },
  { name: "Purple", value: "#7C3AED" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Rose", value: "#E11D48" },
  { name: "Cyan", value: "#06B6D4" },
];

export function ColorCustomizer() {
  const { colors, setColors, resetColors } = useColors();
  const [primaryColor, setPrimaryColor] = useState(colors.primary);
  const [accentColor, setAccentColor] = useState(colors.accent);

  const handlePrimaryChange = (value: string) => {
    setPrimaryColor(value);
    setColors({ ...colors, primary: value });
  };

  const handleAccentChange = (value: string) => {
    setAccentColor(value);
    setColors({ ...colors, accent: value });
  };

  const handleReset = () => {
    resetColors();
    setPrimaryColor("#2a6f97");
    setAccentColor("#2a6f97");
  };

  return (
    <div className="space-y-6 p-4">
      {/* Theme Presets */}
      <ThemePresetsSelector />
      
      <div className="border-t border-border" />
      
      <div className="space-y-4">
        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primary-color" className="text-sm font-medium">
            Cor Primária
          </Label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => handlePrimaryChange(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {primaryColor}
            </span>
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <Label htmlFor="accent-color" className="text-sm font-medium">
            Cor de Destaque
          </Label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                id="accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => handleAccentChange(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {accentColor}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cores Predefinidas</Label>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                handlePrimaryChange(preset.value);
                handleAccentChange(preset.value);
              }}
              className="group relative h-10 rounded-lg border-2 border-transparent transition-all hover:border-foreground/50"
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            >
              <span className="sr-only">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Prévia</Label>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex gap-2">
            <Button
              style={{ backgroundColor: primaryColor }}
              className="flex-1 text-white"
            >
              Primária
            </Button>
            <Button
              style={{ backgroundColor: accentColor }}
              className="flex-1 text-white"
            >
              Destaque
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        onClick={handleReset}
        variant="outline"
        className="w-full"
        size="sm"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Restaurar Padrão
      </Button>
    </div>
  );
}
