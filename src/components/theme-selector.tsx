import { Colors, ThemeName } from "@/constants/theme";
import { useThemeContext } from "@/hooks/use-theme-provider";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const itemWidth = (width - 48) / 2;

export function ThemeSelector() {
    const { currentTheme, setTheme, allThemes, themeDescriptions, colors } = useThemeContext();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>
                Choose Theme
            </Text>

            <ScrollView
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
            >
                {allThemes.map((theme) => (
                    <ThemeCard
                        key={theme}
                        theme={theme}
                        isSelected={currentTheme === theme}
                        onPress={() => setTheme(theme)}
                        description={themeDescriptions[theme]}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

interface ThemeCardProps {
    theme: ThemeName;
    isSelected: boolean;
    onPress: () => void;
    description: string;
}

function ThemeCard({ theme, isSelected, onPress, description }: ThemeCardProps) {
    const themeColors = Colors[theme];

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.primary,
                    borderWidth: isSelected ? 3 : 2,
                    width: itemWidth,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Color Preview */}
            <View style={styles.colorPreview}>
                <View
                    style={[
                        styles.colorBox,
                        { backgroundColor: themeColors.primary },
                    ]}
                />
                <View
                    style={[
                        styles.colorBox,
                        { backgroundColor: themeColors.secondary || themeColors.accent },
                    ]}
                />
                <View
                    style={[
                        styles.colorBox,
                        { backgroundColor: themeColors.success },
                    ]}
                />
            </View>

            {/* Theme Name */}
            <Text
                style={[
                    styles.themeName,
                    { color: themeColors.text },
                ]}
            >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>

            {/* Description */}
            <Text
                style={[
                    styles.description,
                    { color: themeColors.textSecondary },
                ]}
            >
                {description}
            </Text>

            {/* Selection Indicator */}
            {isSelected && (
                <View
                    style={[
                        styles.checkmark,
                        { backgroundColor: themeColors.primary },
                    ]}
                >
                    <Text style={styles.checkmarkText}>✓</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        position: "relative",
    },
    colorPreview: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
        justifyContent: "center",
    },
    colorBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
    },
    themeName: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 4,
    },
    description: {
        fontSize: 12,
        textAlign: "center",
        fontStyle: "italic",
    },
    checkmark: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    checkmarkText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
