/**
 * FunnelPlotViewer Component
 * 
 * Interactive funnel plot visualization with Egger's test results
 * and trim-and-fill analysis.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line, Path, G, Text as SvgText } from 'react-native-svg';
import { useColors } from '../../hooks/use-colors';
import {
  generateFunnelPlotData,
  generateASCIIFunnelPlot,
  type StudyData,
  type FunnelPlotData,
} from '../../lib/visualization/funnel-plot.service';

interface FunnelPlotViewerProps {
  studies: StudyData[];
  showTrimAndFill?: boolean;
  showASCII?: boolean;
  width?: number;
  height?: number;
}

export function FunnelPlotViewer({
  studies,
  showTrimAndFill = true,
  showASCII = false,
  width: propWidth,
  height: propHeight,
}: FunnelPlotViewerProps) {
  const colors = useColors();
  const [selectedStudy, setSelectedStudy] = useState<StudyData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || Math.min(screenWidth - 32, 500);
  const height = propHeight || 300;
  
  const plotData = useMemo(() => {
    if (studies.length === 0) return null;
    return generateFunnelPlotData(studies, showTrimAndFill);
  }, [studies, showTrimAndFill]);
  
  const asciiPlot = useMemo(() => {
    if (!plotData) return '';
    return generateASCIIFunnelPlot(plotData, 60, 20);
  }, [plotData]);
  
  if (!plotData || studies.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          No studies to display. Add at least one study with effect size and standard error.
        </Text>
      </View>
    );
  }
  
  // Calculate plot bounds
  const allEffects = [
    ...studies.map(s => s.effectSize),
    ...(plotData.trimAndFill?.imputedStudies.map(s => s.effectSize) || []),
  ];
  const allSEs = [
    ...studies.map(s => s.standardError),
    ...(plotData.trimAndFill?.imputedStudies.map(s => s.standardError) || []),
  ];
  
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  
  const minEffect = Math.min(...allEffects, ...plotData.confidenceLines.x99Lower) - 0.2;
  const maxEffect = Math.max(...allEffects, ...plotData.confidenceLines.x99Upper) + 0.2;
  const maxSE = Math.max(...allSEs) * 1.2;
  
  const scaleX = (effect: number) => padding.left + ((effect - minEffect) / (maxEffect - minEffect)) * plotWidth;
  const scaleY = (se: number) => padding.top + (se / maxSE) * plotHeight;
  
  // Generate confidence region paths
  const generate95Path = () => {
    const { yValues, x95Lower, x95Upper } = plotData.confidenceLines;
    let path = `M ${scaleX(x95Lower[0])} ${scaleY(yValues[0])}`;
    for (let i = 1; i < yValues.length; i++) {
      path += ` L ${scaleX(x95Lower[i])} ${scaleY(yValues[i])}`;
    }
    for (let i = yValues.length - 1; i >= 0; i--) {
      path += ` L ${scaleX(x95Upper[i])} ${scaleY(yValues[i])}`;
    }
    path += ' Z';
    return path;
  };
  
  const generate99Path = () => {
    const { yValues, x99Lower, x99Upper } = plotData.confidenceLines;
    let path = `M ${scaleX(x99Lower[0])} ${scaleY(yValues[0])}`;
    for (let i = 1; i < yValues.length; i++) {
      path += ` L ${scaleX(x99Lower[i])} ${scaleY(yValues[i])}`;
    }
    for (let i = yValues.length - 1; i >= 0; i--) {
      path += ` L ${scaleX(x99Upper[i])} ${scaleY(yValues[i])}`;
    }
    path += ' Z';
    return path;
  };
  
  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    toggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleButtonText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    svgContainer: {
      alignItems: 'center',
    },
    asciiContainer: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    asciiText: {
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
      fontSize: 10,
      color: colors.primary,
      lineHeight: 12,
    },
    statsContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 8,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    statsLabel: {
      fontSize: 12,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    statsValue: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    interpretation: {
      marginTop: 8,
      padding: 8,
      backgroundColor: plotData.eggerTest.isSignificant ? `${colors.warning}20` : `${colors.success}20`,
      borderRadius: 6,
    },
    interpretationText: {
      fontSize: 11,
      color: plotData.eggerTest.isSignificant ? colors.warning : colors.success,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginTop: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 10,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    selectedStudy: {
      marginTop: 12,
      padding: 8,
      backgroundColor: `${colors.primary}20`,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectedStudyText: {
      fontSize: 11,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>📊 Funnel Plot</Text>
        <TouchableOpacity
          style={dynamicStyles.toggleButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={dynamicStyles.toggleButtonText}>
            {showDetails ? 'Hide Stats' : 'Show Stats'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showASCII ? (
        <ScrollView horizontal style={dynamicStyles.asciiContainer}>
          <Text style={dynamicStyles.asciiText}>{asciiPlot}</Text>
        </ScrollView>
      ) : (
        <View style={dynamicStyles.svgContainer}>
          <Svg width={width} height={height}>
            {/* 99% CI region */}
            <Path
              d={generate99Path()}
              fill={`${colors.muted}15`}
              stroke="none"
            />
            
            {/* 95% CI region */}
            <Path
              d={generate95Path()}
              fill={`${colors.muted}25`}
              stroke="none"
            />
            
            {/* Vertical line at pooled effect */}
            <Line
              x1={scaleX(plotData.pooledEffect)}
              y1={padding.top}
              x2={scaleX(plotData.pooledEffect)}
              y2={height - padding.bottom}
              stroke={colors.primary}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            
            {/* X-axis */}
            <Line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke={colors.border}
              strokeWidth={1}
            />
            
            {/* Y-axis */}
            <Line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke={colors.border}
              strokeWidth={1}
            />
            
            {/* Axis labels */}
            <SvgText
              x={width / 2}
              y={height - 5}
              fill={colors.muted}
              fontSize={10}
              textAnchor="middle"
              fontFamily={Platform.OS === 'web' ? 'monospace' : 'Courier'}
            >
              Effect Size
            </SvgText>
            
            <G rotation={-90} origin={`${15}, ${height / 2}`}>
              <SvgText
                x={15}
                y={height / 2}
                fill={colors.muted}
                fontSize={10}
                textAnchor="middle"
                fontFamily={Platform.OS === 'web' ? 'monospace' : 'Courier'}
              >
                Standard Error
              </SvgText>
            </G>
            
            {/* Imputed studies (if any) */}
            {plotData.trimAndFill?.imputedStudies.map((study, i) => (
              <Circle
                key={`imputed-${i}`}
                cx={scaleX(study.effectSize)}
                cy={scaleY(study.standardError)}
                r={6}
                fill="transparent"
                stroke={colors.warning}
                strokeWidth={2}
                strokeDasharray="3,3"
              />
            ))}
            
            {/* Actual studies */}
            {studies.map((study, i) => (
              <Circle
                key={study.id || i}
                cx={scaleX(study.effectSize)}
                cy={scaleY(study.standardError)}
                r={selectedStudy?.id === study.id ? 8 : 6}
                fill={colors.primary}
                stroke={selectedStudy?.id === study.id ? colors.foreground : 'transparent'}
                strokeWidth={2}
                onPress={() => setSelectedStudy(study)}
              />
            ))}
          </Svg>
        </View>
      )}
      
      {/* Legend */}
      <View style={dynamicStyles.legend}>
        <View style={dynamicStyles.legendItem}>
          <View style={[dynamicStyles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={dynamicStyles.legendText}>Study</Text>
        </View>
        {plotData.trimAndFill && plotData.trimAndFill.k0 > 0 && (
          <View style={dynamicStyles.legendItem}>
            <View style={[dynamicStyles.legendDot, { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.warning, borderStyle: 'dashed' }]} />
            <Text style={dynamicStyles.legendText}>Imputed</Text>
          </View>
        )}
        <View style={dynamicStyles.legendItem}>
          <View style={[dynamicStyles.legendDot, { backgroundColor: `${colors.muted}40` }]} />
          <Text style={dynamicStyles.legendText}>95% CI</Text>
        </View>
      </View>
      
      {/* Selected study info */}
      {selectedStudy && (
        <View style={dynamicStyles.selectedStudy}>
          <Text style={dynamicStyles.selectedStudyText}>
            {selectedStudy.name}: ES = {selectedStudy.effectSize.toFixed(3)}, SE = {selectedStudy.standardError.toFixed(3)}
          </Text>
        </View>
      )}
      
      {/* Statistics */}
      {showDetails && (
        <View style={dynamicStyles.statsContainer}>
          <Text style={dynamicStyles.statsTitle}>Egger&apos;s Test for Asymmetry</Text>
          
          <View style={dynamicStyles.statsRow}>
            <Text style={dynamicStyles.statsLabel}>Intercept:</Text>
            <Text style={dynamicStyles.statsValue}>{plotData.eggerTest.intercept.toFixed(3)}</Text>
          </View>
          
          <View style={dynamicStyles.statsRow}>
            <Text style={dynamicStyles.statsLabel}>SE:</Text>
            <Text style={dynamicStyles.statsValue}>{plotData.eggerTest.interceptSE.toFixed(3)}</Text>
          </View>
          
          <View style={dynamicStyles.statsRow}>
            <Text style={dynamicStyles.statsLabel}>t-value:</Text>
            <Text style={dynamicStyles.statsValue}>{plotData.eggerTest.tValue.toFixed(3)}</Text>
          </View>
          
          <View style={dynamicStyles.statsRow}>
            <Text style={dynamicStyles.statsLabel}>p-value:</Text>
            <Text style={dynamicStyles.statsValue}>{plotData.eggerTest.pValue.toFixed(4)}</Text>
          </View>
          
          <View style={dynamicStyles.interpretation}>
            <Text style={dynamicStyles.interpretationText}>
              {plotData.eggerTest.interpretation}
            </Text>
          </View>
          
          {plotData.trimAndFill && plotData.trimAndFill.k0 > 0 && (
            <>
              <Text style={[dynamicStyles.statsTitle, { marginTop: 16 }]}>Trim-and-Fill Analysis</Text>
              
              <View style={dynamicStyles.statsRow}>
                <Text style={dynamicStyles.statsLabel}>Imputed studies:</Text>
                <Text style={dynamicStyles.statsValue}>{plotData.trimAndFill.k0} ({plotData.trimAndFill.side})</Text>
              </View>
              
              <View style={dynamicStyles.statsRow}>
                <Text style={dynamicStyles.statsLabel}>Original effect:</Text>
                <Text style={dynamicStyles.statsValue}>{plotData.pooledEffect.toFixed(3)}</Text>
              </View>
              
              <View style={dynamicStyles.statsRow}>
                <Text style={dynamicStyles.statsLabel}>Adjusted effect:</Text>
                <Text style={dynamicStyles.statsValue}>{plotData.trimAndFill.adjustedEffect.toFixed(3)}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
});

export default FunnelPlotViewer;
