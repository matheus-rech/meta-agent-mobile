/**
 * PRISMA 2020 Flowchart Renderer
 * Renders the PRISMA flowchart as a visual diagram
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import Svg, { Rect, Line, Polygon, Text as SvgText, G } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import type { PRISMAFlowchart } from "@/lib/workspace";

interface PRISMAFlowchartRendererProps {
  data: PRISMAFlowchart;
  width?: number;
  height?: number;
}

export function PRISMAFlowchartRenderer({
  data,
  width = 800,
  height = 1000,
}: PRISMAFlowchartRendererProps) {
  const colors = useColors();
  
  // Calculate totals
  const totalIdentified =
    data.identification.databaseRecords +
    data.identification.registerRecords +
    data.identification.otherRecords;
  
  // Box dimensions
  const boxWidth = 180;
  const boxHeight = 60;
  const smallBoxHeight = 45;
  const margin = 20;
  
  // Colors
  const boxFill = colors.surface;
  const boxStroke = colors.border;
  const textColor = colors.foreground;
  const arrowColor = colors.muted;
  
  // Helper to draw a box with text
  const Box = ({
    x,
    y,
    w = boxWidth,
    h = boxHeight,
    title,
    count,
    subtitle,
    fill = boxFill,
    stroke = boxStroke,
  }: {
    x: number;
    y: number;
    w?: number;
    h?: number;
    title: string;
    count?: number;
    subtitle?: string;
    fill?: string;
    stroke?: string;
  }) => (
    <G>
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        rx={4}
      />
      <SvgText
        x={x + w / 2}
        y={y + (count !== undefined ? 18 : h / 2 + 5)}
        textAnchor="middle"
        fontSize={11}
        fontWeight="600"
        fill={textColor}
      >
        {title}
      </SvgText>
      {count !== undefined && (
        <SvgText
          x={x + w / 2}
          y={y + 35}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill={colors.primary}
        >
          n = {count.toLocaleString()}
        </SvgText>
      )}
      {subtitle && (
        <SvgText
          x={x + w / 2}
          y={y + h - 8}
          textAnchor="middle"
          fontSize={9}
          fill={colors.muted}
        >
          {subtitle}
        </SvgText>
      )}
    </G>
  );
  
  // Arrow helper
  const Arrow = ({
    x1,
    y1,
    x2,
    y2,
    direction = "down",
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    direction?: "down" | "right" | "left";
  }) => {
    const arrowSize = 6;
    let points = "";
    
    if (direction === "down") {
      points = `${x2 - arrowSize},${y2 - arrowSize} ${x2},${y2} ${x2 + arrowSize},${y2 - arrowSize}`;
    } else if (direction === "right") {
      points = `${x2 - arrowSize},${y2 - arrowSize} ${x2},${y2} ${x2 - arrowSize},${y2 + arrowSize}`;
    } else if (direction === "left") {
      points = `${x2 + arrowSize},${y2 - arrowSize} ${x2},${y2} ${x2 + arrowSize},${y2 + arrowSize}`;
    }
    
    return (
      <G>
        <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={arrowColor} strokeWidth={1.5} />
        <Polygon points={points} fill={arrowColor} />
      </G>
    );
  };
  
  // Section label
  const SectionLabel = ({ x, y, label, color }: { x: number; y: number; label: string; color: string }) => (
    <G>
      <Rect x={x} y={y} width={4} height={20} fill={color} rx={2} />
      <SvgText x={x + 10} y={y + 14} fontSize={12} fontWeight="600" fill={color}>
        {label}
      </SvgText>
    </G>
  );
  
  // Layout positions
  const centerX = width / 2;
  const col1X = centerX - boxWidth - 40;
  const col2X = centerX + 40;
  const rightBoxX = width - boxWidth - margin;
  
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <Svg width={width} height={height}>
            {/* Title */}
            <SvgText
              x={centerX}
              y={30}
              textAnchor="middle"
              fontSize={18}
              fontWeight="bold"
              fill={textColor}
            >
              PRISMA 2020 Flow Diagram
            </SvgText>
            
            {/* IDENTIFICATION Section */}
            <SectionLabel x={margin} y={55} label="Identification" color={colors.primary} />
            
            {/* Database records */}
            <Box
              x={col1X}
              y={80}
              title="Records from databases"
              count={data.identification.databaseRecords}
              subtitle="(e.g., PubMed, Embase)"
            />
            
            {/* Register records */}
            <Box
              x={col2X}
              y={80}
              title="Records from registers"
              count={data.identification.registerRecords}
              subtitle="(e.g., ClinicalTrials.gov)"
            />
            
            {/* Other sources */}
            <Box
              x={rightBoxX}
              y={80}
              w={150}
              title="Other sources"
              count={data.identification.otherRecords}
            />
            
            {/* Arrows from identification to screening */}
            <Arrow x1={col1X + boxWidth / 2} y1={80 + boxHeight} x2={col1X + boxWidth / 2} y2={180} direction="down" />
            <Arrow x1={col2X + boxWidth / 2} y1={80 + boxHeight} x2={col2X + boxWidth / 2} y2={180} direction="down" />
            
            {/* SCREENING Section */}
            <SectionLabel x={margin} y={175} label="Screening" color={colors.warning} />
            
            {/* Duplicates removed */}
            <Box
              x={centerX - boxWidth / 2}
              y={200}
              title="Duplicates removed"
              count={data.screening.duplicatesRemoved}
            />
            
            <Arrow x1={centerX} y1={200 + boxHeight} x2={centerX} y2={290} direction="down" />
            
            {/* Records screened */}
            <Box
              x={centerX - boxWidth / 2}
              y={310}
              title="Records screened"
              count={data.screening.recordsScreened}
            />
            
            {/* Records excluded (right side) */}
            <Box
              x={rightBoxX}
              y={310}
              w={150}
              h={smallBoxHeight}
              title="Records excluded"
              count={data.screening.recordsExcluded}
            />
            
            {/* Arrow to excluded */}
            <Line
              x1={centerX + boxWidth / 2}
              y1={310 + boxHeight / 2}
              x2={rightBoxX}
              y2={310 + smallBoxHeight / 2}
              stroke={arrowColor}
              strokeWidth={1.5}
            />
            
            <Arrow x1={centerX} y1={310 + boxHeight} x2={centerX} y2={400} direction="down" />
            
            {/* ELIGIBILITY Section */}
            <SectionLabel x={margin} y={395} label="Eligibility" color={colors.error} />
            
            {/* Reports retrieved */}
            <Box
              x={centerX - boxWidth / 2}
              y={420}
              title="Reports retrieved"
              count={data.eligibility.reportsRetrieved}
            />
            
            {/* Reports not retrieved */}
            <Box
              x={rightBoxX}
              y={420}
              w={150}
              h={smallBoxHeight}
              title="Not retrieved"
              count={data.eligibility.reportsNotRetrieved}
            />
            
            <Line
              x1={centerX + boxWidth / 2}
              y1={420 + boxHeight / 2}
              x2={rightBoxX}
              y2={420 + smallBoxHeight / 2}
              stroke={arrowColor}
              strokeWidth={1.5}
            />
            
            <Arrow x1={centerX} y1={420 + boxHeight} x2={centerX} y2={510} direction="down" />
            
            {/* Reports assessed */}
            <Box
              x={centerX - boxWidth / 2}
              y={530}
              title="Reports assessed"
              count={data.eligibility.reportsAssessed}
            />
            
            {/* Reports excluded with reasons */}
            <Box
              x={rightBoxX}
              y={530}
              w={150}
              h={smallBoxHeight + data.eligibility.exclusionReasons.length * 15}
              title="Reports excluded"
              count={data.eligibility.reportsExcluded}
            />
            
            {/* Exclusion reasons */}
            {data.eligibility.exclusionReasons.map((reason, index) => (
              <SvgText
                key={index}
                x={rightBoxX + 75}
                y={530 + smallBoxHeight + index * 15}
                textAnchor="middle"
                fontSize={9}
                fill={colors.muted}
              >
                {reason.reason} (n={reason.count})
              </SvgText>
            ))}
            
            <Line
              x1={centerX + boxWidth / 2}
              y1={530 + boxHeight / 2}
              x2={rightBoxX}
              y2={530 + smallBoxHeight / 2}
              stroke={arrowColor}
              strokeWidth={1.5}
            />
            
            <Arrow x1={centerX} y1={530 + boxHeight} x2={centerX} y2={620} direction="down" />
            
            {/* INCLUDED Section */}
            <SectionLabel x={margin} y={615} label="Included" color={colors.success} />
            
            {/* Studies included */}
            <Box
              x={centerX - boxWidth / 2}
              y={640}
              title="Studies included"
              count={data.included.studiesIncluded}
              fill={colors.success + "20"}
              stroke={colors.success}
            />
            
            <Arrow x1={centerX} y1={640 + boxHeight} x2={centerX} y2={730} direction="down" />
            
            {/* Reports included */}
            <Box
              x={centerX - boxWidth / 2}
              y={750}
              title="Reports of included studies"
              count={data.included.reportsIncluded}
              fill={colors.success + "20"}
              stroke={colors.success}
            />
            
            {/* Footer */}
            <SvgText
              x={centerX}
              y={height - 20}
              textAnchor="middle"
              fontSize={10}
              fill={colors.muted}
            >
              Generated with Meta Agent - PRISMA 2020 Guidelines
            </SvgText>
          </Svg>
        </View>
      </ScrollView>
    </ScrollView>
  );
}
