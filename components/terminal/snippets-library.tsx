/**
 * R Code Snippets Library
 * Pre-built templates for meta-analysis, data extraction, and more
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface Snippet {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  parameters?: { name: string; placeholder: string; description: string }[];
}

// Comprehensive R code snippets from the skills.md files
export const snippets: Snippet[] = [
  // Meta-Analysis - Binary Outcomes
  {
    id: "meta-binary",
    name: "Binary Meta-Analysis",
    description: "Meta-analysis for binary outcomes (OR, RR, RD)",
    category: "Meta-Analysis",
    code: `library(meta)
library(metafor)

data <- read.csv("{{INPUT_FILE}}")

ma <- metabin(
  event.e = events_int,
  n.e = n_int,
  event.c = events_ctrl,
  n.c = n_ctrl,
  studlab = paste(study, year),
  data = data,
  sm = "{{MEASURE}}",  # OR, RR, or RD
  method = "MH",
  random = TRUE,
  fixed = FALSE,
  prediction = TRUE,
  hakn = TRUE
)

# Forest plot
png("forest_plot.png", width = 1200, height = 800, res = 150)
forest(ma, sortvar = TE, prediction = TRUE,
       print.tau2 = TRUE, print.I2 = TRUE)
dev.off()

# Summary
print(summary(ma))`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "data.csv", description: "CSV file path" },
      { name: "MEASURE", placeholder: "OR", description: "Effect measure (OR, RR, RD)" },
    ],
  },

  // Meta-Analysis - Continuous Outcomes
  {
    id: "meta-continuous",
    name: "Continuous Meta-Analysis",
    description: "Meta-analysis for continuous outcomes (MD, SMD)",
    category: "Meta-Analysis",
    code: `library(meta)

data <- read.csv("{{INPUT_FILE}}")

ma <- metacont(
  n.e = n_int,
  mean.e = mean_int,
  sd.e = sd_int,
  n.c = n_ctrl,
  mean.c = mean_ctrl,
  sd.c = sd_ctrl,
  studlab = paste(study, year),
  data = data,
  sm = "{{MEASURE}}",  # MD or SMD
  random = TRUE,
  hakn = TRUE
)

# Forest plot
png("forest_plot.png", width = 1200, height = 800, res = 150)
forest(ma, sortvar = TE, prediction = TRUE)
dev.off()

print(summary(ma))`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "data.csv", description: "CSV file path" },
      { name: "MEASURE", placeholder: "MD", description: "Effect measure (MD or SMD)" },
    ],
  },

  // Heterogeneity Assessment
  {
    id: "heterogeneity",
    name: "Heterogeneity Assessment",
    description: "Comprehensive heterogeneity analysis with I², τ², and prediction intervals",
    category: "Meta-Analysis",
    code: `# Heterogeneity Assessment
cat("=== HETEROGENEITY ASSESSMENT ===\\n\\n")

# Statistics
cat(sprintf("I² = %.1f%% [%.1f%%, %.1f%%]\\n",
            ma$I2*100, ma$lower.I2*100, ma$upper.I2*100))
cat(sprintf("τ² = %.4f (τ = %.4f)\\n", ma$tau2, sqrt(ma$tau2)))
cat(sprintf("H² = %.2f\\n", ma$H^2))
cat(sprintf("Q = %.2f, df = %d, p = %.4f\\n", ma$Q, ma$df.Q, ma$pval.Q))
cat(sprintf("\\nPrediction interval: [%.2f, %.2f]\\n",
            exp(ma$lower.predict), exp(ma$upper.predict)))

# Baujat plot (outlier detection)
png("baujat_plot.png", width = 800, height = 600, res = 150)
baujat(ma)
dev.off()`,
    parameters: [],
  },

  // Publication Bias
  {
    id: "pub-bias",
    name: "Publication Bias Assessment",
    description: "Funnel plot, Egger's test, and trim-and-fill analysis",
    category: "Meta-Analysis",
    code: `# Publication Bias Assessment
if (ma$k >= 10) {
  # Funnel plot
  png("funnel_plot.png", width = 800, height = 600, res = 150)
  funnel(ma, studlab = TRUE, cex.studlab = 0.7)
  dev.off()
  
  # Contour-enhanced funnel plot
  png("funnel_contour.png", width = 800, height = 600, res = 150)
  funnel(ma, contour = c(0.9, 0.95, 0.99),
         col.contour = c("darkgray", "gray", "lightgray"))
  legend("topright", c("p < 0.10", "p < 0.05", "p < 0.01"),
         fill = c("darkgray", "gray", "lightgray"), bty = "n")
  dev.off()
  
  # Statistical tests
  cat("\\n=== PUBLICATION BIAS TESTS ===\\n\\n")
  
  egger <- metabias(ma, method = "Egger")
  cat(sprintf("Egger's test: t = %.2f, p = %.4f\\n",
              egger$statistic, egger$p.value))
  
  # Trim-and-fill
  tf <- trimfill(ma)
  cat(sprintf("\\nTrim-and-fill: %d studies imputed\\n", tf$k0))
  cat(sprintf("Adjusted estimate: %.2f [%.2f, %.2f]\\n",
              exp(tf$TE.random), exp(tf$lower.random), exp(tf$upper.random)))
} else {
  cat("Note: k < 10, publication bias tests unreliable.\\n")
}`,
    parameters: [],
  },

  // Sensitivity Analysis
  {
    id: "sensitivity",
    name: "Sensitivity Analysis",
    description: "Leave-one-out, influence diagnostics, and cumulative meta-analysis",
    category: "Meta-Analysis",
    code: `# Leave-one-out analysis
l1o <- metainf(ma, pooled = "random")
png("leave_one_out.png", width = 1000, height = 600, res = 150)
forest(l1o)
dev.off()

# Influence diagnostics
inf <- influence(ma)
png("influence.png", width = 1000, height = 800, res = 150)
plot(inf)
dev.off()

# Cumulative meta-analysis (by year)
cum <- metacum(ma, sortvar = data$year)
png("cumulative.png", width = 1000, height = 600, res = 150)
forest(cum)
dev.off()

# Report influential studies
cat("\\n=== INFLUENTIAL STUDIES ===\\n\\n")
influential <- which(inf$is.infl)
if (length(influential) > 0) {
  cat("Potentially influential studies:\\n")
  for (i in influential) {
    cat(sprintf("  - %s\\n", ma$studlab[i]))
  }
} else {
  cat("No studies identified as influential.\\n")
}`,
    parameters: [],
  },

  // Subgroup Analysis
  {
    id: "subgroup",
    name: "Subgroup Analysis",
    description: "Subgroup meta-analysis with test for interaction",
    category: "Meta-Analysis",
    code: `# Subgroup Analysis
ma_sub <- update(ma, subgroup = data[["{{SUBGROUP_VAR}}"]])

# Forest plot with subgroups
png("forest_subgroup.png", width = 1400, height = 1000, res = 150)
forest(ma_sub,
       sortvar = TE,
       prediction = TRUE,
       subgroup = TRUE,
       print.subgroup.labels = TRUE,
       subgroup.hetstat = TRUE)
dev.off()

# Test for subgroup differences
cat("\\n=== SUBGROUP ANALYSIS ===\\n\\n")
cat(sprintf("Test for subgroup differences:\\n"))
cat(sprintf("  Q = %.2f, df = %d, p = %.4f\\n",
            ma_sub$Q.b.random, ma_sub$df.Q.b, ma_sub$pval.Q.b.random))`,
    parameters: [
      { name: "SUBGROUP_VAR", placeholder: "subgroup", description: "Subgroup variable name in data" },
    ],
  },

  // Network Meta-Analysis
  {
    id: "nma",
    name: "Network Meta-Analysis",
    description: "Compare multiple treatments with network plot and rankings",
    category: "Network Meta-Analysis",
    code: `library(netmeta)

data <- read.csv("{{INPUT_FILE}}")

# Calculate effect sizes for binary outcomes
data$TE <- log((data$events1 / (data$n1 - data$events1)) / 
               (data$events2 / (data$n2 - data$events2)))
data$seTE <- sqrt(1/data$events1 + 1/(data$n1-data$events1) + 
                   1/data$events2 + 1/(data$n2-data$events2))

# Run NMA
nma <- netmeta(
  TE = TE,
  seTE = seTE,
  treat1 = treat1,
  treat2 = treat2,
  studlab = study,
  data = data,
  sm = "OR",
  reference.group = "{{REFERENCE}}",
  random = TRUE
)

# Network plot
png("network_plot.png", width = 800, height = 800, res = 150)
netgraph(nma, plastic = TRUE, thickness = "number.of.studies",
         number.of.studies = TRUE, points = TRUE, cex.points = 3)
dev.off()

# Forest plot vs reference
png("forest_nma.png", width = 1000, height = 800, res = 150)
forest(nma, reference.group = "{{REFERENCE}}", sortvar = -TE)
dev.off()

# Rankings
rank <- netrank(nma, small.values = "bad")
print(rank)

summary(nma)`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "nma_data.csv", description: "CSV file path" },
      { name: "REFERENCE", placeholder: "Placebo", description: "Reference treatment" },
    ],
  },

  // Risk of Bias - RoB 2
  {
    id: "rob2-plot",
    name: "RoB 2 Visualization",
    description: "Traffic light and summary plots for RCT risk of bias",
    category: "Risk of Bias",
    code: `library(robvis)
library(ggplot2)

rob2_data <- read.csv("{{INPUT_FILE}}")

# Traffic light plot
rob2_traffic <- rob_traffic_light(
  data = rob2_data,
  tool = "ROB2",
  colour = "cochrane",
  psize = 10
)

ggsave("rob2_traffic_light.png", rob2_traffic, 
       width = 12, height = nrow(rob2_data) * 0.5 + 2, dpi = 300)

# Summary plot
rob2_summary <- rob_summary(
  data = rob2_data,
  tool = "ROB2",
  overall = TRUE,
  colour = "cochrane"
)

ggsave("rob2_summary.png", rob2_summary, 
       width = 10, height = 6, dpi = 300)`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "rob2_data.csv", description: "RoB 2 data CSV" },
    ],
  },

  // Newcastle-Ottawa Scale
  {
    id: "nos-plot",
    name: "Newcastle-Ottawa Scale Plot",
    description: "Quality assessment visualization for cohort studies",
    category: "Risk of Bias",
    code: `library(ggplot2)

nos_data <- read.csv("{{INPUT_FILE}}")

# Bar chart
nos_plot <- ggplot(nos_data, aes(x = reorder(Study, Total), y = Total)) +
  geom_col(aes(fill = Quality), width = 0.7) +
  geom_hline(yintercept = c(4, 7), linetype = "dashed", alpha = 0.5) +
  geom_text(aes(label = Total), hjust = -0.3, size = 4) +
  coord_flip() +
  scale_fill_manual(
    values = c("Good" = "#4CAF50", "Fair" = "#FFC107", "Poor" = "#F44336"),
    name = "Quality"
  ) +
  scale_y_continuous(limits = c(0, 10), breaks = 0:9) +
  labs(
    x = "",
    y = "Newcastle-Ottawa Scale Score",
    title = "Risk of Bias: Newcastle-Ottawa Scale",
    subtitle = "Good: 7-9 stars | Fair: 4-6 stars | Poor: 0-3 stars"
  ) +
  theme_minimal() +
  theme(legend.position = "bottom")

ggsave("nos_scores.png", nos_plot, 
       width = 10, height = max(6, nrow(nos_data) * 0.4), dpi = 300)`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "nos_data.csv", description: "NOS data CSV" },
    ],
  },

  // Trial Sequential Analysis
  {
    id: "tsa",
    name: "Trial Sequential Analysis",
    description: "TSA with O'Brien-Fleming boundaries and RIS calculation",
    category: "TSA",
    code: `library(meta)

data <- read.csv("{{INPUT_FILE}}")
data <- data[order(data$year), ]

# Meta-analysis
ma <- metabin(event.e = events_int, n.e = n_int,
              event.c = events_ctrl, n.c = n_ctrl,
              studlab = study, data = data, sm = "OR", random = TRUE)

# Cumulative meta-analysis
cum <- metacum(ma, sortvar = data$year)

# Calculate Required Information Size
p_control <- sum(data$events_ctrl) / sum(data$n_ctrl)
rrr <- {{RRR}}  # Relative risk reduction
alpha <- 0.05
beta <- 0.10

p_int <- p_control * (1 - rrr)
za <- qnorm(1 - alpha/2)
zb <- qnorm(1 - beta)

n_per_group <- ((za + zb)^2 * (p_control * (1 - p_control) + 
                                p_int * (1 - p_int))) /
                (p_control - p_int)^2

ris <- ceiling(2 * n_per_group * (1 / (1 - ma$I2)))

# Summary
current_n <- sum(data$n_int) + sum(data$n_ctrl)
cat(sprintf("Required Information Size: %d\\n", ris))
cat(sprintf("Current sample size: %d\\n", current_n))
cat(sprintf("Information fraction: %.1f%%\\n", 100 * current_n / ris))`,
    parameters: [
      { name: "INPUT_FILE", placeholder: "data.csv", description: "CSV file path" },
      { name: "RRR", placeholder: "0.20", description: "Relative risk reduction" },
    ],
  },

  // Effect Size Calculations
  {
    id: "effect-calc",
    name: "Effect Size Calculations",
    description: "Calculate OR, RR, MD, SMD from raw data",
    category: "Data Extraction",
    code: `# Odds Ratio from 2x2 table
calc_or <- function(a, b, c, d) {
  # a=events_int, b=non-events_int, c=events_ctrl, d=non-events_ctrl
  or <- (a * d) / (b * c)
  se_log <- sqrt(1/a + 1/b + 1/c + 1/d)
  ci_lower <- exp(log(or) - 1.96 * se_log)
  ci_upper <- exp(log(or) + 1.96 * se_log)
  list(or=or, ci_lower=ci_lower, ci_upper=ci_upper, se_log=se_log)
}

# Mean Difference
calc_md <- function(mean1, sd1, n1, mean2, sd2, n2) {
  md <- mean1 - mean2
  se <- sqrt(sd1^2/n1 + sd2^2/n2)
  ci_lower <- md - 1.96 * se
  ci_upper <- md + 1.96 * se
  list(md=md, se=se, ci_lower=ci_lower, ci_upper=ci_upper)
}

# Standardized Mean Difference (Hedges' g)
calc_smd <- function(mean1, sd1, n1, mean2, sd2, n2) {
  pooled_sd <- sqrt(((n1-1)*sd1^2 + (n2-1)*sd2^2) / (n1+n2-2))
  d <- (mean1 - mean2) / pooled_sd
  j <- 1 - 3/(4*(n1+n2-2)-1)  # Hedges' correction
  g <- d * j
  se <- sqrt((n1+n2)/(n1*n2) + g^2/(2*(n1+n2)))
  list(smd=g, se=se, ci_lower=g-1.96*se, ci_upper=g+1.96*se)
}

# Example usage:
# result <- calc_or(10, 40, 5, 45)
# print(result)`,
    parameters: [],
  },

  // Median/IQR to Mean/SD
  {
    id: "median-convert",
    name: "Median/IQR to Mean/SD",
    description: "Convert median and IQR to mean and SD (Wan et al. method)",
    category: "Data Extraction",
    code: `# Wan et al. 2014 method - Median + IQR
median_iqr_to_mean_sd <- function(median, q1, q3, n) {
  mean_est <- (q1 + median + q3) / 3
  sd_est <- (q3 - q1) / 1.35
  list(mean = mean_est, sd = sd_est)
}

# Hozo et al. 2005 - Median + Range
median_range_to_mean_sd <- function(median, min, max, n) {
  mean_est <- (min + 2*median + max) / 4
  sd_est <- (max - min) / 4
  list(mean = mean_est, sd = sd_est)
}

# From SE to SD
se_to_sd <- function(se, n) {
  sd <- se * sqrt(n)
  return(sd)
}

# From 95% CI to SD
ci_to_sd <- function(ci_lower, ci_upper, n) {
  sd <- (ci_upper - ci_lower) * sqrt(n) / 3.92
  return(sd)
}

# Example:
# result <- median_iqr_to_mean_sd(median=10, q1=7, q3=14, n=50)
# print(result)`,
    parameters: [],
  },

  // PRISMA Flow Diagram Data
  {
    id: "prisma-data",
    name: "PRISMA Flow Diagram Data",
    description: "Generate PRISMA 2020 flow diagram data",
    category: "Manuscript",
    code: `# PRISMA 2020 Flow Diagram Data
prisma_data <- list(
  identification = list(
    databases = {{N_DATABASES}},
    registers = {{N_REGISTERS}},
    other = {{N_OTHER}}
  ),
  duplicates_removed = {{N_DUPLICATES}},
  screening = list(
    records_screened = {{N_SCREENED}},
    records_excluded = {{N_EXCLUDED_TITLE}}
  ),
  eligibility = list(
    reports_sought = {{N_SOUGHT}},
    reports_not_retrieved = {{N_NOT_RETRIEVED}},
    reports_assessed = {{N_ASSESSED}},
    reports_excluded = {{N_EXCLUDED_FULL}},
    exclusion_reasons = c(
      "Wrong population" = {{N_WRONG_POP}},
      "Wrong intervention" = {{N_WRONG_INT}},
      "Wrong outcome" = {{N_WRONG_OUT}},
      "Wrong study design" = {{N_WRONG_DESIGN}}
    )
  ),
  included = list(
    studies = {{N_STUDIES}},
    reports = {{N_REPORTS}}
  )
)

# Print summary
cat("=== PRISMA Flow Summary ===\\n")
cat(sprintf("Records identified: %d\\n", 
    prisma_data$identification$databases + 
    prisma_data$identification$registers))
cat(sprintf("After duplicates removed: %d\\n", 
    prisma_data$screening$records_screened))
cat(sprintf("Full-text assessed: %d\\n", 
    prisma_data$eligibility$reports_assessed))
cat(sprintf("Studies included: %d\\n", prisma_data$included$studies))`,
    parameters: [
      { name: "N_DATABASES", placeholder: "500", description: "Records from databases" },
      { name: "N_REGISTERS", placeholder: "50", description: "Records from registers" },
      { name: "N_OTHER", placeholder: "10", description: "Records from other sources" },
      { name: "N_DUPLICATES", placeholder: "100", description: "Duplicates removed" },
      { name: "N_SCREENED", placeholder: "460", description: "Records screened" },
      { name: "N_EXCLUDED_TITLE", placeholder: "400", description: "Excluded at title/abstract" },
      { name: "N_SOUGHT", placeholder: "60", description: "Reports sought for retrieval" },
      { name: "N_NOT_RETRIEVED", placeholder: "5", description: "Reports not retrieved" },
      { name: "N_ASSESSED", placeholder: "55", description: "Reports assessed for eligibility" },
      { name: "N_EXCLUDED_FULL", placeholder: "35", description: "Reports excluded" },
      { name: "N_WRONG_POP", placeholder: "10", description: "Wrong population" },
      { name: "N_WRONG_INT", placeholder: "8", description: "Wrong intervention" },
      { name: "N_WRONG_OUT", placeholder: "7", description: "Wrong outcome" },
      { name: "N_WRONG_DESIGN", placeholder: "10", description: "Wrong study design" },
      { name: "N_STUDIES", placeholder: "20", description: "Studies included" },
      { name: "N_REPORTS", placeholder: "22", description: "Reports included" },
    ],
  },
];

// Group snippets by category
export const snippetCategories = Array.from(
  new Set(snippets.map((s) => s.category))
);

interface SnippetsLibraryProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (code: string) => void;
}

export function SnippetsLibrary({
  visible,
  onClose,
  onInsert,
}: SnippetsLibraryProps) {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSnippets = snippets.filter((s) => {
    const matchesCategory = !selectedCategory || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectSnippet = (snippet: Snippet) => {
    setSelectedSnippet(snippet);
    // Initialize parameter values with placeholders
    const initialValues: Record<string, string> = {};
    snippet.parameters?.forEach((p) => {
      initialValues[p.name] = p.placeholder;
    });
    setParamValues(initialValues);
  };

  const handleInsert = () => {
    if (!selectedSnippet) return;

    let code = selectedSnippet.code;
    // Replace parameters
    Object.entries(paramValues).forEach(([key, value]) => {
      code = code.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    onInsert(code);
    setSelectedSnippet(null);
    setParamValues({});
    onClose();
  };

  const handleBack = () => {
    if (selectedSnippet) {
      setSelectedSnippet(null);
      setParamValues({});
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85%",
            minHeight: "60%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={handleBack}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>
                {selectedSnippet || selectedCategory ? "Back" : "Close"}
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {selectedSnippet
                ? selectedSnippet.name
                : selectedCategory || "R Code Snippets"}
            </Text>
            <View style={{ width: 50 }} />
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {selectedSnippet ? (
              // Snippet detail view with parameters
              <View>
                <Text
                  style={{
                    color: colors.muted,
                    marginBottom: 16,
                  }}
                >
                  {selectedSnippet.description}
                </Text>

                {selectedSnippet.parameters &&
                  selectedSnippet.parameters.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontWeight: "600",
                          marginBottom: 12,
                        }}
                      >
                        Parameters
                      </Text>
                      {selectedSnippet.parameters.map((param) => (
                        <View key={param.name} style={{ marginBottom: 12 }}>
                          <Text
                            style={{
                              color: colors.foreground,
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            {param.name}
                          </Text>
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 11,
                              marginBottom: 4,
                            }}
                          >
                            {param.description}
                          </Text>
                          <TextInput
                            value={paramValues[param.name] || ""}
                            onChangeText={(text) =>
                              setParamValues((prev) => ({
                                ...prev,
                                [param.name]: text,
                              }))
                            }
                            placeholder={param.placeholder}
                            placeholderTextColor={colors.muted}
                            style={{
                              backgroundColor: colors.surface,
                              color: colors.foreground,
                              padding: 10,
                              borderRadius: 6,
                              fontFamily: "monospace",
                              fontSize: 13,
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  )}

                {/* Code preview */}
                <Text
                  style={{
                    color: colors.foreground,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Code Preview
                </Text>
                <ScrollView
                  horizontal
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 200,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                  >
                    {selectedSnippet.code}
                  </Text>
                </ScrollView>

                {/* Insert button */}
                <TouchableOpacity
                  onPress={handleInsert}
                  style={{
                    backgroundColor: colors.primary,
                    padding: 14,
                    borderRadius: 8,
                    marginTop: 16,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Insert Code
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Category/snippet list view
              <View>
                {/* Search */}
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search snippets..."
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                />

                {/* Categories or snippets */}
                {!selectedCategory ? (
                  // Show categories
                  snippetCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={{
                        backgroundColor: colors.surface,
                        padding: 16,
                        borderRadius: 8,
                        marginBottom: 8,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontWeight: "600",
                          }}
                        >
                          {category}
                        </Text>
                        <Text
                          style={{
                            color: colors.muted,
                            fontSize: 12,
                            marginTop: 2,
                          }}
                        >
                          {snippets.filter((s) => s.category === category).length}{" "}
                          snippets
                        </Text>
                      </View>
                      <Text style={{ color: colors.muted }}>→</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  // Show snippets in category
                  filteredSnippets.map((snippet) => (
                    <TouchableOpacity
                      key={snippet.id}
                      onPress={() => handleSelectSnippet(snippet)}
                      style={{
                        backgroundColor: colors.surface,
                        padding: 14,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontWeight: "600",
                        }}
                      >
                        {snippet.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {snippet.description}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
