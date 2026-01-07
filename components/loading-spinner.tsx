import { View, Text, ActivityIndicator, StyleSheet, DimensionValue } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Size of the spinner */
  size?: "small" | "large";
  /** Whether to show full screen overlay */
  fullScreen?: boolean;
}

/**
 * Loading spinner component for async operations
 */
export function LoadingSpinner({ 
  message, 
  size = "large",
  fullScreen = false 
}: LoadingSpinnerProps) {
  const colors = useColors();

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.muted }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

/**
 * Skeleton loading placeholder for content
 */
export function SkeletonLoader({ 
  width = "100%", 
  height = 20,
  borderRadius = 4 
}: { 
  width?: DimensionValue; 
  height?: number;
  borderRadius?: number;
}) {
  const colors = useColors();

  return (
    <View 
      style={[
        styles.skeleton, 
        { 
          width, 
          height, 
          borderRadius,
          backgroundColor: colors.surface,
        }
      ]} 
    />
  );
}

/**
 * Loading state wrapper component
 */
export function LoadingState({ 
  isLoading, 
  children,
  loadingMessage,
  fullScreen = false,
}: { 
  isLoading: boolean; 
  children: React.ReactNode;
  loadingMessage?: string;
  fullScreen?: boolean;
}) {
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} fullScreen={fullScreen} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  skeleton: {
    opacity: 0.5,
  },
});
