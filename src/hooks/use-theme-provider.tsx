import { Colors, ThemeDescriptions, ThemeName } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface ThemeContextType {
    currentTheme: ThemeName;
    setTheme: (theme: ThemeName) => Promise<void>;
    colors: typeof Colors.light;
    allThemes: ThemeName[];
    themeDescriptions: Record<ThemeName, string>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [currentTheme, setCurrentTheme] = useState<ThemeName>("light");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem("SELECTED_THEME");
                if (savedTheme && savedTheme in Colors) {
                    setCurrentTheme(savedTheme as ThemeName);
                }
            } catch (error) {
                console.log("Failed to load theme:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTheme();
    }, []);

    const setTheme = async (theme: ThemeName) => {
        try {
            setCurrentTheme(theme);
            await AsyncStorage.setItem("SELECTED_THEME", theme);
        } catch (error) {
            console.log("Failed to save theme:", error);
        }
    };

    const allThemes = Object.keys(Colors) as ThemeName[];

    if (!isLoaded) {
        // Return default theme while loading
        return (
            <ThemeContext.Provider
                value={{
                    currentTheme: "light",
                    setTheme,
                    colors: Colors.light,
                    allThemes,
                    themeDescriptions: ThemeDescriptions,
                }}
            >
                {children}
            </ThemeContext.Provider>
        );
    }

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                setTheme,
                colors: Colors[currentTheme],
                allThemes,
                themeDescriptions: ThemeDescriptions,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for components not wrapped in ThemeProvider
        return {
            currentTheme: "light" as ThemeName,
            setTheme: async () => { },
            colors: Colors.light,
            allThemes: Object.keys(Colors) as ThemeName[],
            themeDescriptions: ThemeDescriptions,
        };
    }
    return context;
}
