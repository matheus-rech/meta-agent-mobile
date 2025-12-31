/**
 * PROSPERO Search Component
 * UI for searching and importing systematic review protocols from PROSPERO
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

interface PROSPEROSearchProps {
  visible: boolean;
  onClose: () => void;
  onImport: (protocol: PROSPEROProtocol) => void;
}

interface PROSPEROSearchResult {
  id: string;
  title: string;
  status: string;
  registrationDate: string;
  authors: string;
}

interface PROSPEROProtocol {
  id: string;
  title: string;
  status: string;
  registrationDate: string;
  lastUpdated: string;
  authors: string[];
  reviewQuestion: string;
  population: string;
  intervention: string;
  comparator: string;
  outcomes: string;
  studyDesigns: string;
  databases: string[];
  searchStrategy: string;
  dataExtraction: string;
  riskOfBias: string;
  synthesisMethod: string;
  startDate: string;
  expectedCompletion: string;
  fundingSource: string;
  conflicts: string;
  keywords: string[];
  country: string;
  stage: string;
  url: string;
}

export function PROSPEROSearch({ visible, onClose, onImport }: PROSPEROSearchProps) {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [crdIdInput, setCrdIdInput] = useState("");
  const [searchResults, setSearchResults] = useState<PROSPEROSearchResult[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<PROSPEROProtocol | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"search" | "id">("search");

  const searchMutation = trpc.prospero.search.useMutation();
  const fetchMutation = trpc.prospero.fetchProtocol.useMutation();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const result = await searchMutation.mutateAsync({ query: searchQuery });
      if (result.success) {
        setSearchResults(result.results);
        if (result.results.length === 0) {
          setError("No protocols found matching your search.");
        }
      } else {
        setError(result.error || "Search failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchById = async () => {
    const crdId = crdIdInput.trim().toUpperCase();
    if (!crdId) return;

    // Validate format
    if (!crdId.match(/^CRD\d{11,}$/)) {
      setError("Invalid CRD ID format. Expected: CRD followed by 11+ digits (e.g., CRD42021234567)");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetchMutation.mutateAsync({ crdId });
      if (result.success && result.protocol) {
        setSelectedProtocol(result.protocol);
      } else {
        setError(result.error || "Failed to fetch protocol");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch protocol");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSelectResult = async (result: PROSPEROSearchResult) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsFetching(true);
    setError(null);

    try {
      const fetchResult = await fetchMutation.mutateAsync({ crdId: result.id });
      if (fetchResult.success && fetchResult.protocol) {
        setSelectedProtocol(fetchResult.protocol);
      } else {
        setError(fetchResult.error || "Failed to fetch protocol details");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch protocol");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = () => {
    if (selectedProtocol) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onImport(selectedProtocol);
      setSelectedProtocol(null);
      onClose();
    }
  };

  const renderSearchResult = ({ item }: { item: PROSPEROSearchResult }) => (
    <TouchableOpacity
      onPress={() => handleSelectResult(item)}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
          {item.id}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {item.status}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted }}>
        {item.authors}
      </Text>
    </TouchableOpacity>
  );

  const ProtocolSection = ({ title, content }: { title: string; content: string | string[] }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    const displayContent = Array.isArray(content) ? content.join(", ") : content;
    if (!displayContent) return null;

    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary, marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
          {displayContent}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            paddingTop: Platform.OS === "ios" ? 60 : 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.muted, fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
            PROSPERO
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Protocol Detail View */}
        {selectedProtocol ? (
          <View style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontSize: 12, color: colors.primary, marginBottom: 4 }}>
                {selectedProtocol.id}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
                {selectedProtocol.title}
              </Text>

              <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Status</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>{selectedProtocol.status || "Unknown"}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Registered</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>{selectedProtocol.registrationDate || "Unknown"}</Text>
                </View>
              </View>

              <ProtocolSection title="Review Question" content={selectedProtocol.reviewQuestion} />
              
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12, marginTop: 8 }}>
                PICO Elements
              </Text>
              <ProtocolSection title="Population" content={selectedProtocol.population} />
              <ProtocolSection title="Intervention" content={selectedProtocol.intervention} />
              <ProtocolSection title="Comparator" content={selectedProtocol.comparator} />
              <ProtocolSection title="Outcomes" content={selectedProtocol.outcomes} />

              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12, marginTop: 8 }}>
                Methods
              </Text>
              <ProtocolSection title="Study Designs" content={selectedProtocol.studyDesigns} />
              <ProtocolSection title="Databases" content={selectedProtocol.databases} />
              <ProtocolSection title="Risk of Bias Assessment" content={selectedProtocol.riskOfBias} />
              <ProtocolSection title="Data Synthesis" content={selectedProtocol.synthesisMethod} />

              <ProtocolSection title="Keywords" content={selectedProtocol.keywords} />
              <ProtocolSection title="Funding" content={selectedProtocol.fundingSource} />

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 16,
                paddingBottom: Platform.OS === "ios" ? 34 : 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedProtocol(null)}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleImport}
                style={{
                  flex: 2,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.background, fontWeight: "600" }}>Import to Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Tab Selector */}
            <View style={{ flexDirection: "row", padding: 16, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setActiveTab("search")}
                style={{
                  flex: 1,
                  backgroundColor: activeTab === "search" ? colors.primary : colors.surface,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === "search" ? colors.background : colors.foreground,
                    fontWeight: "600",
                  }}
                >
                  Search
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("id")}
                style={{
                  flex: 1,
                  backgroundColor: activeTab === "id" ? colors.primary : colors.surface,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === "id" ? colors.background : colors.foreground,
                    fontWeight: "600",
                  }}
                >
                  By CRD ID
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Tab */}
            {activeTab === "search" && (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8 }}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search protocols..."
                    placeholderTextColor={colors.muted}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      color: colors.foreground,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={isSearching}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      justifyContent: "center",
                      opacity: isSearching ? 0.6 : 1,
                    }}
                  >
                    {isSearching ? (
                      <ActivityIndicator color={colors.background} size="small" />
                    ) : (
                      <Text style={{ color: colors.background, fontWeight: "600" }}>Search</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {error && (
                  <View style={{ padding: 16 }}>
                    <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
                  </View>
                )}

                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSearchResult}
                  contentContainerStyle={{ padding: 16 }}
                  ListEmptyComponent={
                    !isSearching && searchQuery ? (
                      <View style={{ alignItems: "center", paddingTop: 40 }}>
                        <Text style={{ fontSize: 16, color: colors.muted }}>
                          Enter a search term and tap Search
                        </Text>
                      </View>
                    ) : null
                  }
                />
              </View>
            )}

            {/* CRD ID Tab */}
            {activeTab === "id" && (
              <View style={{ flex: 1, padding: 16 }}>
                <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 12 }}>
                  Enter a PROSPERO registration number to fetch the protocol directly.
                </Text>
                <TextInput
                  value={crdIdInput}
                  onChangeText={setCrdIdInput}
                  placeholder="CRD42021234567"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  onSubmitEditing={handleFetchById}
                  returnKeyType="go"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 18,
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                />
                <TouchableOpacity
                  onPress={handleFetchById}
                  disabled={isFetching}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: "center",
                    opacity: isFetching ? 0.6 : 1,
                  }}
                >
                  {isFetching ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>
                      Fetch Protocol
                    </Text>
                  )}
                </TouchableOpacity>

                {error && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
                  </View>
                )}

                <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.surface, borderRadius: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                    Where to find the CRD ID?
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>
                    The CRD ID is shown on the PROSPERO record page and in the URL. It starts with "CRD" followed by the year and a unique number (e.g., CRD42021234567).
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Loading Overlay */}
        {isFetching && !selectedProtocol && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ backgroundColor: colors.background, padding: 24, borderRadius: 12 }}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={{ color: colors.foreground, marginTop: 12 }}>Fetching protocol...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
