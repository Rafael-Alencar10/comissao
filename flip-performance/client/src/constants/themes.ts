export interface ThemePreset {
  name: string;
  displayName: string;
  description: string;
  primary: string;
  accent: string;
  colors: {
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
  };
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  sunset: {
    name: "sunset",
    displayName: "Pôr do Sol",
    description: "Tons quentes de laranja, coral e dourado",
    primary: "#FF6B35",
    accent: "#F7931E",
    colors: {
      chart1: "#FF6B35",
      chart2: "#F7931E",
      chart3: "#FFB84D",
      chart4: "#FF8C42",
    },
  },
  ocean: {
    name: "ocean",
    displayName: "Oceano",
    description: "Tons de azul e turquesa do mar",
    primary: "#0077BE",
    accent: "#00B4D8",
    colors: {
      chart1: "#0077BE",
      chart2: "#00B4D8",
      chart3: "#48CAE4",
      chart4: "#90E0EF",
    },
  },
  forest: {
    name: "forest",
    displayName: "Floresta",
    description: "Tons de verde e terra da natureza",
    primary: "#2D6A4F",
    accent: "#40916C",
    colors: {
      chart1: "#2D6A4F",
      chart2: "#40916C",
      chart3: "#52B788",
      chart4: "#74C69D",
    },
  },
};

export const THEME_PRESET_LIST = Object.values(THEME_PRESETS);
