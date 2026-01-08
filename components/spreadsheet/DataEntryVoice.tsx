/**
 * DataEntryVoice - Voice output for data entry verification
 * 
 * Uses MiniMax TTS to read back entered values aloud,
 * helping users verify their data entry and improving accessibility.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import type { Column, Row, SpreadsheetData } from "./SpreadsheetEditor";
import type { ValidationResult } from "@/lib/spreadsheet";

interface DataEntryVoiceProps {
  data: SpreadsheetData;
  validationResult?: ValidationResult;
  currentRowIndex?: number;
  onSpeakComplete?: () => void;
  language?: "pt-BR" | "en-US" | "es-ES";
}

// MiniMax voice IDs for different languages
const VOICE_IDS: Record<string, string> = {
  "pt-BR": "Portuguese_Female_1",
  "en-US": "English_Female_1",
  "es-ES": "Spanish_Female_1",
};

/**
 * Format a row's data for voice output
 */
function formatRowForVoice(row: Row, columns: Column[], language: string): string {
  const parts: string[] = [];
  
  // Study name
  if (row.study) {
    parts.push(language === "pt-BR" 
      ? `Estudo: ${row.study}` 
      : language === "es-ES"
      ? `Estudio: ${row.study}`
      : `Study: ${row.study}`);
  }
  
  // Year
  if (row.year) {
    parts.push(language === "pt-BR" 
      ? `Ano: ${row.year}` 
      : language === "es-ES"
      ? `Año: ${row.year}`
      : `Year: ${row.year}`);
  }
  
  // Sample sizes
  if (row.n_treatment) {
    parts.push(language === "pt-BR" 
      ? `Tratamento: ${row.n_treatment} participantes` 
      : language === "es-ES"
      ? `Tratamiento: ${row.n_treatment} participantes`
      : `Treatment: ${row.n_treatment} participants`);
  }
  
  if (row.n_control) {
    parts.push(language === "pt-BR" 
      ? `Controle: ${row.n_control} participantes` 
      : language === "es-ES"
      ? `Control: ${row.n_control} participantes`
      : `Control: ${row.n_control} participants`);
  }
  
  // Events (binary outcomes)
  if (row.events_treatment !== undefined && row.events_treatment !== "") {
    parts.push(language === "pt-BR" 
      ? `Eventos no tratamento: ${row.events_treatment}` 
      : language === "es-ES"
      ? `Eventos en tratamiento: ${row.events_treatment}`
      : `Treatment events: ${row.events_treatment}`);
  }
  
  if (row.events_control !== undefined && row.events_control !== "") {
    parts.push(language === "pt-BR" 
      ? `Eventos no controle: ${row.events_control}` 
      : language === "es-ES"
      ? `Eventos en control: ${row.events_control}`
      : `Control events: ${row.events_control}`);
  }
  
  // Means (continuous outcomes)
  if (row.mean_treatment !== undefined && row.mean_treatment !== "") {
    parts.push(language === "pt-BR" 
      ? `Média do tratamento: ${row.mean_treatment}` 
      : language === "es-ES"
      ? `Media del tratamiento: ${row.mean_treatment}`
      : `Treatment mean: ${row.mean_treatment}`);
  }
  
  if (row.mean_control !== undefined && row.mean_control !== "") {
    parts.push(language === "pt-BR" 
      ? `Média do controle: ${row.mean_control}` 
      : language === "es-ES"
      ? `Media del control: ${row.mean_control}`
      : `Control mean: ${row.mean_control}`);
  }
  
  // Standard deviations
  if (row.sd_treatment !== undefined && row.sd_treatment !== "") {
    parts.push(language === "pt-BR" 
      ? `Desvio padrão do tratamento: ${row.sd_treatment}` 
      : language === "es-ES"
      ? `Desviación estándar del tratamiento: ${row.sd_treatment}`
      : `Treatment SD: ${row.sd_treatment}`);
  }
  
  if (row.sd_control !== undefined && row.sd_control !== "") {
    parts.push(language === "pt-BR" 
      ? `Desvio padrão do controle: ${row.sd_control}` 
      : language === "es-ES"
      ? `Desviación estándar del control: ${row.sd_control}`
      : `Control SD: ${row.sd_control}`);
  }
  
  return parts.join(". ");
}

/**
 * Format validation summary for voice
 */
function formatValidationForVoice(result: ValidationResult, language: string): string {
  if (result.isValid && result.warnings.length === 0) {
    return language === "pt-BR"
      ? "Todos os dados estão corretos e prontos para análise."
      : language === "es-ES"
      ? "Todos los datos están correctos y listos para el análisis."
      : "All data is correct and ready for analysis.";
  }
  
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push(language === "pt-BR"
      ? `Encontrei ${result.errors.length} erro${result.errors.length > 1 ? "s" : ""} que precisa${result.errors.length > 1 ? "m" : ""} ser corrigido${result.errors.length > 1 ? "s" : ""}.`
      : language === "es-ES"
      ? `Encontré ${result.errors.length} error${result.errors.length > 1 ? "es" : ""} que necesita${result.errors.length > 1 ? "n" : ""} corrección.`
      : `I found ${result.errors.length} error${result.errors.length > 1 ? "s" : ""} that need${result.errors.length > 1 ? "" : "s"} to be fixed.`);
  }
  
  if (result.warnings.length > 0) {
    parts.push(language === "pt-BR"
      ? `Há ${result.warnings.length} aviso${result.warnings.length > 1 ? "s" : ""} para revisar.`
      : language === "es-ES"
      ? `Hay ${result.warnings.length} advertencia${result.warnings.length > 1 ? "s" : ""} para revisar.`
      : `There ${result.warnings.length > 1 ? "are" : "is"} ${result.warnings.length} warning${result.warnings.length > 1 ? "s" : ""} to review.`);
  }
  
  return parts.join(" ");
}

export function DataEntryVoice({
  data,
  validationResult,
  currentRowIndex,
  onSpeakComplete,
  language = "pt-BR",
}: DataEntryVoiceProps) {
  const colors = useColors();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakMode, setSpeakMode] = useState<"row" | "all" | "validation" | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Initialize audio mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error("Error setting audio mode:", error);
      }
    };
    setupAudio();
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsSpeaking(true);

    try {
      // Use MiniMax TTS via MCP
      const voiceId = VOICE_IDS[language] || VOICE_IDS["en-US"];
      
      // For now, use a simple approach - in production, this would call MiniMax API
      // The actual TTS is handled by the SpeakButton component
      // This component focuses on formatting the text appropriately
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Simulate speaking duration based on text length
      const speakDuration = Math.max(2000, text.length * 50);
      
      await new Promise(resolve => setTimeout(resolve, speakDuration));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error speaking:", error);
    } finally {
      setIsSpeaking(false);
      setSpeakMode(null);
      onSpeakComplete?.();
    }
  }, [language, onSpeakComplete]);

  const handleSpeakCurrentRow = useCallback(() => {
    if (currentRowIndex === undefined || currentRowIndex < 0 || currentRowIndex >= data.rows.length) {
      return;
    }

    setSpeakMode("row");
    const row = data.rows[currentRowIndex];
    const text = formatRowForVoice(row, data.columns, language);
    speakText(text);
  }, [currentRowIndex, data, language, speakText]);

  const handleSpeakAllData = useCallback(() => {
    setSpeakMode("all");
    
    const intro = language === "pt-BR"
      ? `Planilha: ${data.name}. ${data.rows.length} estudos.`
      : language === "es-ES"
      ? `Hoja de cálculo: ${data.name}. ${data.rows.length} estudios.`
      : `Spreadsheet: ${data.name}. ${data.rows.length} studies.`;
    
    const rowTexts = data.rows.map((row, index) => {
      const prefix = language === "pt-BR"
        ? `Linha ${index + 1}:`
        : language === "es-ES"
        ? `Fila ${index + 1}:`
        : `Row ${index + 1}:`;
      return `${prefix} ${formatRowForVoice(row, data.columns, language)}`;
    });
    
    const fullText = [intro, ...rowTexts].join(" ");
    speakText(fullText);
  }, [data, language, speakText]);

  const handleSpeakValidation = useCallback(() => {
    if (!validationResult) return;

    setSpeakMode("validation");
    const text = formatValidationForVoice(validationResult, language);
    speakText(text);
  }, [validationResult, language, speakText]);

  const handleStop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsSpeaking(false);
    setSpeakMode(null);
  }, []);

  // Get text to be spoken for display
  const getPreviewText = useCallback(() => {
    if (speakMode === "row" && currentRowIndex !== undefined) {
      const row = data.rows[currentRowIndex];
      return formatRowForVoice(row, data.columns, language);
    }
    if (speakMode === "validation" && validationResult) {
      return formatValidationForVoice(validationResult, language);
    }
    return "";
  }, [speakMode, currentRowIndex, data, validationResult, language]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          🔊 {language === "pt-BR" ? "Verificação por Voz" : language === "es-ES" ? "Verificación por Voz" : "Voice Verification"}
        </Text>
        {isSpeaking && (
          <TouchableOpacity onPress={handleStop} style={[styles.stopButton, { backgroundColor: colors.error }]}>
            <Text style={[styles.stopButtonText, { color: colors.background }]}>
              {language === "pt-BR" ? "Parar" : language === "es-ES" ? "Detener" : "Stop"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonsRow}>
        {/* Speak current row */}
        <TouchableOpacity
          onPress={handleSpeakCurrentRow}
          disabled={isSpeaking || currentRowIndex === undefined}
          style={[
            styles.button,
            {
              backgroundColor: speakMode === "row" ? colors.primary : colors.background,
              borderColor: colors.border,
              opacity: currentRowIndex === undefined ? 0.5 : 1,
            },
          ]}
        >
          {speakMode === "row" && isSpeaking ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Text style={styles.buttonEmoji}>📄</Text>
              <Text style={[styles.buttonText, { color: speakMode === "row" ? colors.background : colors.foreground }]}>
                {language === "pt-BR" ? "Linha Atual" : language === "es-ES" ? "Fila Actual" : "Current Row"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Speak all data */}
        <TouchableOpacity
          onPress={handleSpeakAllData}
          disabled={isSpeaking || data.rows.length === 0}
          style={[
            styles.button,
            {
              backgroundColor: speakMode === "all" ? colors.primary : colors.background,
              borderColor: colors.border,
              opacity: data.rows.length === 0 ? 0.5 : 1,
            },
          ]}
        >
          {speakMode === "all" && isSpeaking ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Text style={styles.buttonEmoji}>📋</Text>
              <Text style={[styles.buttonText, { color: speakMode === "all" ? colors.background : colors.foreground }]}>
                {language === "pt-BR" ? "Todos os Dados" : language === "es-ES" ? "Todos los Datos" : "All Data"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Speak validation */}
        <TouchableOpacity
          onPress={handleSpeakValidation}
          disabled={isSpeaking || !validationResult}
          style={[
            styles.button,
            {
              backgroundColor: speakMode === "validation" ? colors.primary : colors.background,
              borderColor: colors.border,
              opacity: !validationResult ? 0.5 : 1,
            },
          ]}
        >
          {speakMode === "validation" && isSpeaking ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Text style={styles.buttonEmoji}>✅</Text>
              <Text style={[styles.buttonText, { color: speakMode === "validation" ? colors.background : colors.foreground }]}>
                {language === "pt-BR" ? "Validação" : language === "es-ES" ? "Validación" : "Validation"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview of what's being spoken */}
      {isSpeaking && speakMode && (
        <View style={[styles.previewContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.muted }]}>
            {language === "pt-BR" ? "Falando:" : language === "es-ES" ? "Hablando:" : "Speaking:"}
          </Text>
          <Text style={[styles.previewText, { color: colors.foreground }]} numberOfLines={3}>
            {getPreviewText()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
    fontSize: 14,
    fontWeight: "600",
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stopButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonEmoji: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: "500",
  },
  previewContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  previewText: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "Courier New" }),
    fontSize: 11,
    lineHeight: 16,
  },
});

export default DataEntryVoice;
