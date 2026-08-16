import { ThemeSelector } from "@/components/theme-selector";
import { useThemeContext } from "@/hooks/use-theme-provider";
import {
    SafeAreaView,
    ScrollView,
    SectionListData,
    StyleSheet,
    Text,
    View
} from "react-native";

interface Section extends SectionListData<never, any> {
    title: string;
    data: never[];
}

export default function SettingsScreen() {
    const { colors } = useThemeContext();

    const sections: Section[] = [
        {
            title: "APPEARANCE",
            data: [],
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Theme Section */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        APPEARANCE
                    </Text>
                    <View
                        style={[
                            styles.sectionContent,
                            { backgroundColor: colors.backgroundElement },
                        ]}
                    >
                        <ThemeSelector />
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        ABOUT
                    </Text>
                    <View
                        style={[
                            styles.sectionContent,
                            { backgroundColor: colors.backgroundElement },
                        ]}
                    >
                        <SettingRow
                            label="App Name"
                            value="Day Planner"
                            colors={colors}
                        />
                        <Divider colors={colors} />
                        <SettingRow
                            label="Version"
                            value="1.0.0"
                            colors={colors}
                        />
                        <Divider colors={colors} />
                        <SettingRow
                            label="Build"
                            value="August 2026"
                            colors={colors}
                        />
                    </View>
                </View>

                {/* Developer Section */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        FEATURES
                    </Text>
                    <View
                        style={[
                            styles.sectionContent,
                            { backgroundColor: colors.backgroundElement },
                        ]}
                    >
                        <FeatureItem label="📅 Daily Planning" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="📊 Analytics & Charts" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="🎯 Goal Tracking" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="⏰ Reminders & Notifications" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="🏆 Achievements & Streaks" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="💾 Data Backup & Export" colors={colors} />
                        <Divider colors={colors} />
                        <FeatureItem label="🎨 7 Beautiful Themes" colors={colors} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface SettingRowProps {
    label: string;
    value: string;
    colors: any;
}

function SettingRow({ label, value, colors }: SettingRowProps) {
    return (
        <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
                {label}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                {value}
            </Text>
        </View>
    );
}

interface FeatureItemProps {
    label: string;
    colors: any;
}

function FeatureItem({ label, colors }: FeatureItemProps) {
    return (
        <View style={styles.featureItem}>
            <Text style={[styles.featureLabel, { color: colors.text }]}>
                {label}
            </Text>
        </View>
    );
}

interface DividerProps {
    colors: any;
}

function Divider({ colors }: DividerProps) {
    return <View style={[styles.divider, { backgroundColor: colors.backgroundSelected }]} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    sectionContent: {
        borderRadius: 12,
        overflow: "hidden",
    },
    settingRow: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    settingValue: {
        fontSize: 14,
        fontWeight: "400",
    },
    featureItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    featureLabel: {
        fontSize: 15,
        fontWeight: "500",
        letterSpacing: 0.2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
});
