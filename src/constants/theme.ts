/**
 * Below are the colors that are used in the app. The colors are defined in multiple themes.
 * Themes available: light, dark, ocean, forest, sunset, minimal, cyberpunk
 */

import "@/global.css";

import { Platform } from "react-native";

export type ThemeName =
  | "light"
  | "dark"
  | "ocean"
  | "forest"
  | "sunset"
  | "minimal"
  | "cyberpunk";

export const Colors: Record<
  ThemeName,
  {
    text: string;
    background: string;
    backgroundElement: string;
    backgroundSelected: string;
    textSecondary: string;
    primary: string;
    secondary?: string;
    accent?: string;
    success?: string;
    warning?: string;
    error?: string;
  }
> = {
  // Classic Light Theme
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    primary: "#208AEF",
    secondary: "#6C7280",
    accent: "#EC4899",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
  },

  // Classic Dark Theme
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
    primary: "#4AABFF",
    secondary: "#9CA3AF",
    accent: "#F472B6",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
  },

  // Ocean Theme
  ocean: {
    text: "#0F172A",
    background: "#F0F9FF",
    backgroundElement: "#E0F2FE",
    backgroundSelected: "#BAE6FD",
    textSecondary: "#0C4A6E",
    primary: "#0369A1",
    secondary: "#06B6D4",
    accent: "#0EA5E9",
    success: "#06B6D4",
    warning: "#F97316",
    error: "#DC2626",
  },

  // Forest Theme
  forest: {
    text: "#0B2E1D",
    background: "#F0FDF4",
    backgroundElement: "#DCFCE7",
    backgroundSelected: "#BBEE63",
    textSecondary: "#166534",
    primary: "#15803D",
    secondary: "#059669",
    accent: "#10B981",
    success: "#22C55E",
    warning: "#EA580C",
    error: "#DC2626",
  },

  // Sunset Theme
  sunset: {
    text: "#7C2D12",
    background: "#FEF3C7",
    backgroundElement: "#FDE68A",
    backgroundSelected: "#FCD34D",
    textSecondary: "#B45309",
    primary: "#D97706",
    secondary: "#F59E0B",
    accent: "#EC4899",
    success: "#10B981",
    warning: "#D97706",
    error: "#DC2626",
  },

  // Minimal Theme (Monochrome)
  minimal: {
    text: "#1F1F1F",
    background: "#FAFAFA",
    backgroundElement: "#F5F5F5",
    backgroundSelected: "#E8E8E8",
    textSecondary: "#757575",
    primary: "#424242",
    secondary: "#616161",
    accent: "#1F1F1F",
    success: "#558B2F",
    warning: "#F57F17",
    error: "#C62828",
  },

  // Cyberpunk Theme
  cyberpunk: {
    text: "#FF00FF",
    background: "#0D0221",
    backgroundElement: "#1A0033",
    backgroundSelected: "#330066",
    textSecondary: "#00FFFF",
    primary: "#FF006E",
    secondary: "#00F5FF",
    accent: "#FF006E",
    success: "#00FF41",
    warning: "#FFD60A",
    error: "#FF006E",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const ThemeDescriptions: Record<ThemeName, string> = {
  light: "Bright and clean",
  dark: "Easy on the eyes",
  ocean: "Calm and serene",
  forest: "Natural and fresh",
  sunset: "Warm and cozy",
  minimal: "Simple and elegant",
  cyberpunk: "Futuristic vibes",
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
