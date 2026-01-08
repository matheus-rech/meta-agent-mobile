/**
 * PlotDigitizer Component
 * 
 * WebPlotDigitizer-style tool for extracting data points from images.
 * Supports axis calibration, point extraction, and curve tracing.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../hooks/use-colors';

interface Point {
  id: string;
  pixelX: number;
  pixelY: number;
  dataX?: number;
  dataY?: number;
}

interface AxisCalibration {
  x1Pixel: number;
  y1Pixel: number;
  x1Value: number;
  y1Value: number;
  x2Pixel: number;
  y2Pixel: number;
  x2Value: number;
  y2Value: number;
  isCalibrated: boolean;
}

interface PlotDigitizerProps {
  visible: boolean;
  onClose: () => void;
  onExport: (data: { x: number; y: number }[]) => void;
}

type Mode = 'calibrate-x1' | 'calibrate-x2' | 'calibrate-y1' | 'calibrate-y2' | 'extract';

export function PlotDigitizer({
  visible,
  onClose,
  onExport,
}: PlotDigitizerProps) {
  const colors = useColors();
  const imageRef = useRef<View>(null);
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  
  const [mode, setMode] = useState<Mode>('calibrate-x1');
  const [calibration, setCalibration] = useState<AxisCalibration>({
    x1Pixel: 0,
    y1Pixel: 0,
    x1Value: 0,
    y1Value: 0,
    x2Pixel: 0,
    y2Pixel: 0,
    x2Value: 1,
    y2Value: 1,
    isCalibrated: false,
  });
  
  const [points, setPoints] = useState<Point[]>([]);
  const [tempValue, setTempValue] = useState('');
  
  const screenWidth = Dimensions.get('window').width;
  const maxImageWidth = Math.min(screenWidth - 64, 600);
  
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageSize({ width: asset.width, height: asset.height });
      
      // Calculate display size maintaining aspect ratio
      const aspectRatio = asset.width / asset.height;
      let displayWidth = maxImageWidth;
      let displayHeight = displayWidth / aspectRatio;
      
      if (displayHeight > 400) {
        displayHeight = 400;
        displayWidth = displayHeight * aspectRatio;
      }
      
      setDisplaySize({ width: displayWidth, height: displayHeight });
      
      // Reset state
      setMode('calibrate-x1');
      setCalibration({
        x1Pixel: 0,
        y1Pixel: 0,
        x1Value: 0,
        y1Value: 0,
        x2Pixel: 0,
        y2Pixel: 0,
        x2Value: 1,
        y2Value: 1,
        isCalibrated: false,
      });
      setPoints([]);
    }
  }, [maxImageWidth]);
  
  const handleImagePress = useCallback((event: GestureResponderEvent) => {
    if (!imageUri) return;
    
    const { locationX, locationY } = event.nativeEvent;
    
    // Convert display coordinates to pixel coordinates
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;
    const pixelX = locationX * scaleX;
    const pixelY = locationY * scaleY;
    
    if (mode === 'calibrate-x1') {
      setCalibration(prev => ({ ...prev, x1Pixel: pixelX, y1Pixel: pixelY }));
      setTempValue('');
    } else if (mode === 'calibrate-x2') {
      setCalibration(prev => ({ ...prev, x2Pixel: pixelX, y2Pixel: pixelY }));
      setTempValue('');
    } else if (mode === 'calibrate-y1') {
      setCalibration(prev => ({ ...prev, y1Pixel: pixelX, y1Value: pixelY }));
      setTempValue('');
    } else if (mode === 'calibrate-y2') {
      setCalibration(prev => ({ ...prev, y2Pixel: pixelX, y2Value: pixelY }));
      setTempValue('');
    } else if (mode === 'extract' && calibration.isCalibrated) {
      // Convert pixel to data coordinates
      const dataX = pixelToDataX(pixelX);
      const dataY = pixelToDataY(pixelY);
      
      const newPoint: Point = {
        id: `point_${Date.now()}`,
        pixelX,
        pixelY,
        dataX,
        dataY,
      };
      
      setPoints(prev => [...prev, newPoint]);
    }
  }, [imageUri, mode, calibration, imageSize, displaySize]);
  
  const pixelToDataX = (pixelX: number): number => {
    const { x1Pixel, x1Value, x2Pixel, x2Value } = calibration;
    const slope = (x2Value - x1Value) / (x2Pixel - x1Pixel);
    return x1Value + slope * (pixelX - x1Pixel);
  };
  
  const pixelToDataY = (pixelY: number): number => {
    const { y1Pixel, y1Value, y2Pixel, y2Value } = calibration;
    // Note: Y is inverted in image coordinates
    const slope = (y2Value - y1Value) / (y2Pixel - y1Pixel);
    return y1Value + slope * (pixelY - y1Pixel);
  };
  
  const setCalibrationValue = useCallback(() => {
    const value = parseFloat(tempValue);
    if (isNaN(value)) return;
    
    if (mode === 'calibrate-x1') {
      setCalibration(prev => ({ ...prev, x1Value: value }));
      setMode('calibrate-x2');
    } else if (mode === 'calibrate-x2') {
      setCalibration(prev => ({ ...prev, x2Value: value }));
      setMode('calibrate-y1');
    } else if (mode === 'calibrate-y1') {
      setCalibration(prev => ({ ...prev, y1Value: value }));
      setMode('calibrate-y2');
    } else if (mode === 'calibrate-y2') {
      setCalibration(prev => ({ ...prev, y2Value: value, isCalibrated: true }));
      setMode('extract');
    }
    
    setTempValue('');
  }, [mode, tempValue]);
  
  const removePoint = useCallback((id: string) => {
    setPoints(prev => prev.filter(p => p.id !== id));
  }, []);
  
  const clearPoints = useCallback(() => {
    setPoints([]);
  }, []);
  
  const handleExport = useCallback(() => {
    const data = points
      .filter(p => p.dataX !== undefined && p.dataY !== undefined)
      .map(p => ({ x: p.dataX!, y: p.dataY! }))
      .sort((a, b) => a.x - b.x);
    
    onExport(data);
    onClose();
  }, [points, onExport, onClose]);
  
  const getModeInstructions = (): string => {
    switch (mode) {
      case 'calibrate-x1':
        return 'Tap a point on the X-axis (left side) and enter its value';
      case 'calibrate-x2':
        return 'Tap a point on the X-axis (right side) and enter its value';
      case 'calibrate-y1':
        return 'Tap a point on the Y-axis (bottom) and enter its value';
      case 'calibrate-y2':
        return 'Tap a point on the Y-axis (top) and enter its value';
      case 'extract':
        return 'Tap on data points to extract their coordinates';
      default:
        return '';
    }
  };
  
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: colors.muted,
      fontSize: 20,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    instructions: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    instructionsText: {
      fontSize: 13,
      color: colors.primary,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    imagePlaceholder: {
      width: maxImageWidth,
      height: 200,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      color: colors.muted,
      fontSize: 14,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    imageWrapper: {
      position: 'relative',
    },
    image: {
      borderRadius: 8,
    },
    pointMarker: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
      transform: [{ translateX: -6 }, { translateY: -6 }],
    },
    calibrationMarker: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.warning,
      borderWidth: 2,
      borderColor: colors.background,
      transform: [{ translateX: -8 }, { translateY: -8 }],
    },
    calibrationSection: {
      marginBottom: 16,
    },
    calibrationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    calibrationInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: 10,
      color: colors.foreground,
      fontSize: 14,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    setButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 6,
    },
    setButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    pointsSection: {
      flex: 1,
      marginBottom: 16,
    },
    pointsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    pointsTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.error,
      borderRadius: 4,
    },
    clearButtonText: {
      color: colors.background,
      fontSize: 12,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    pointsList: {
      maxHeight: 150,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
    },
    pointItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pointText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    removeButton: {
      padding: 4,
    },
    removeButtonText: {
      color: colors.error,
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    uploadButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    uploadButtonText: {
      color: colors.foreground,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    exportButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    exportButtonDisabled: {
      opacity: 0.5,
    },
    exportButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 16,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>📐 Plot Digitizer</Text>
            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={dynamicStyles.content}>
            {/* Instructions */}
            <View style={dynamicStyles.instructions}>
              <Text style={dynamicStyles.instructionsText}>
                {getModeInstructions()}
              </Text>
            </View>
            
            {/* Status Bar */}
            <View style={dynamicStyles.statusBar}>
              <View style={dynamicStyles.statusItem}>
                <View style={[dynamicStyles.statusDot, { backgroundColor: mode.startsWith('calibrate') ? colors.warning : colors.success }]} />
                <Text style={dynamicStyles.statusText}>
                  {calibration.isCalibrated ? 'Calibrated' : 'Calibrating'}
                </Text>
              </View>
              <View style={dynamicStyles.statusItem}>
                <View style={[dynamicStyles.statusDot, { backgroundColor: colors.primary }]} />
                <Text style={dynamicStyles.statusText}>
                  {points.length} points
                </Text>
              </View>
            </View>
            
            {/* Image Container */}
            <View style={dynamicStyles.imageContainer}>
              {imageUri ? (
                <TouchableOpacity
                  style={dynamicStyles.imageWrapper}
                  onPress={handleImagePress}
                  activeOpacity={1}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={[dynamicStyles.image, { width: displaySize.width, height: displaySize.height }]}
                    resizeMode="contain"
                  />
                  
                  {/* Calibration markers */}
                  {calibration.x1Pixel > 0 && (
                    <View
                      style={[
                        dynamicStyles.calibrationMarker,
                        {
                          left: (calibration.x1Pixel / imageSize.width) * displaySize.width,
                          top: (calibration.y1Pixel / imageSize.height) * displaySize.height,
                        },
                      ]}
                    />
                  )}
                  {calibration.x2Pixel > 0 && (
                    <View
                      style={[
                        dynamicStyles.calibrationMarker,
                        {
                          left: (calibration.x2Pixel / imageSize.width) * displaySize.width,
                          top: (calibration.y2Pixel / imageSize.height) * displaySize.height,
                        },
                      ]}
                    />
                  )}
                  
                  {/* Data points */}
                  {points.map(point => (
                    <View
                      key={point.id}
                      style={[
                        dynamicStyles.pointMarker,
                        {
                          left: (point.pixelX / imageSize.width) * displaySize.width,
                          top: (point.pixelY / imageSize.height) * displaySize.height,
                        },
                      ]}
                    />
                  ))}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={dynamicStyles.imagePlaceholder} onPress={pickImage}>
                  <Text style={dynamicStyles.placeholderText}>📷 Tap to upload image</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Calibration Input */}
            {mode.startsWith('calibrate') && (
              <View style={dynamicStyles.calibrationSection}>
                <View style={dynamicStyles.calibrationRow}>
                  <TextInput
                    style={dynamicStyles.calibrationInput}
                    value={tempValue}
                    onChangeText={setTempValue}
                    placeholder={`Enter ${mode.includes('x') ? 'X' : 'Y'} value...`}
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={setCalibrationValue}
                  />
                  <TouchableOpacity
                    style={dynamicStyles.setButton}
                    onPress={setCalibrationValue}
                  >
                    <Text style={dynamicStyles.setButtonText}>Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Points List */}
            {points.length > 0 && (
              <View style={dynamicStyles.pointsSection}>
                <View style={dynamicStyles.pointsHeader}>
                  <Text style={dynamicStyles.pointsTitle}>
                    Extracted Points ({points.length})
                  </Text>
                  <TouchableOpacity style={dynamicStyles.clearButton} onPress={clearPoints}>
                    <Text style={dynamicStyles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={dynamicStyles.pointsList}>
                  {points.map((point, index) => (
                    <View key={point.id} style={dynamicStyles.pointItem}>
                      <Text style={dynamicStyles.pointText}>
                        {index + 1}. X: {point.dataX?.toFixed(3)} | Y: {point.dataY?.toFixed(3)}
                      </Text>
                      <TouchableOpacity
                        style={dynamicStyles.removeButton}
                        onPress={() => removePoint(point.id)}
                      >
                        <Text style={dynamicStyles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>
          
          {/* Footer */}
          <View style={dynamicStyles.footer}>
            <TouchableOpacity style={dynamicStyles.uploadButton} onPress={pickImage}>
              <Text style={dynamicStyles.uploadButtonText}>
                {imageUri ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.exportButton,
                points.length === 0 && dynamicStyles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={points.length === 0}
            >
              <Text style={dynamicStyles.exportButtonText}>
                Export Data
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default PlotDigitizer;
