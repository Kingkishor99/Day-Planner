import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export function SplashScreen({ isVisible = true }: { isVisible?: boolean }) {
    const colors = useTheme();
    const [fadeAnim] = useState(new Animated.Value(1));
    const [scaleAnim] = useState(new Animated.Value(0.8));

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [scaleAnim]);

    if (!isVisible) return null;

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
        >
            <Animated.View
                style={[
                    styles.content,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: fadeAnim,
                    },
                ]}
            >
                {/* Icon Circle */}
                <View
                    style={[
                        styles.iconCircle,
                        { backgroundColor: colors.primary },
                    ]}
                >
                    <Text style={styles.iconText}>📅</Text>
                </View>

                {/* App Name */}
                <Text
                    style={[
                        styles.appName,
                        { color: colors.text },
                    ]}
                >
                    Day Planner
                </Text>

                {/* Tagline */}
                <Text
                    style={[
                        styles.tagline,
                        { color: colors.textSecondary },
                    ]}
                >
                    Your Daily Companion
                </Text>

                {/* Loading Indicator */}
                <View style={styles.loaderContainer}>
                    <Animated.View
                        style={[
                            styles.loaderDot,
                            {
                                backgroundColor: colors.primary,
                                opacity: fadeAnim,
                            },
                        ]}
                    />
                    <View
                        style={[
                            styles.loaderDot,
                            {
                                backgroundColor: colors.primary,
                                opacity: 0.6,
                            },
                        ]}
                    />
                    <View
                        style={[
                            styles.loaderDot,
                            {
                                backgroundColor: colors.primary,
                                opacity: 0.3,
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    content: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    iconText: {
        fontSize: 60,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        marginBottom: 40,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    loaderContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    loaderDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
