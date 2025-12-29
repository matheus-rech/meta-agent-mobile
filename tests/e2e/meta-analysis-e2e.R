# ============================================================================
# META-AGENT E2E TEST SUITE
# Comprehensive testing of meta-analysis methods, plots, and reports
# ============================================================================

library(metafor)
library(ggplot2)
library(jsonlite)
library(dplyr)
library(tidyr)

# Create output directory
output_dir <- "/home/ubuntu/meta-agent-mobile/tests/e2e/output"
dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)

# Initialize results list
results <- list(
  timestamp = Sys.time(),
  r_version = R.version.string,
  tests = list()
)

cat("\n")
cat("╔══════════════════════════════════════════════════════════════════════╗\n")
cat("║           META-AGENT E2E TEST SUITE                                  ║\n")
cat("║           Testing Meta-Analysis Methods & Visualizations            ║\n")
cat("╚══════════════════════════════════════════════════════════════════════╝\n")
cat("\n")

# ============================================================================
# TEST 1: Binary Outcome Meta-Analysis (Odds Ratio)
# ============================================================================
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 1: Binary Outcome Meta-Analysis (Odds Ratio)\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

# Sample data: RCTs comparing treatment vs control for surgical outcomes
binary_data <- data.frame(
  study = c("Smith 2018", "Johnson 2019", "Williams 2020", "Brown 2021", 
            "Davis 2021", "Miller 2022", "Wilson 2022", "Moore 2023"),
  year = c(2018, 2019, 2020, 2021, 2021, 2022, 2022, 2023),
  events_treat = c(12, 8, 15, 10, 18, 14, 9, 20),
  n_treat = c(50, 45, 60, 55, 70, 65, 48, 80),
  events_ctrl = c(22, 15, 28, 18, 30, 25, 17, 35),
  n_ctrl = c(52, 47, 62, 53, 72, 63, 50, 78)
)

tryCatch({
  # Calculate effect sizes (log odds ratio)
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_data)
  
  # Random-effects meta-analysis
  ma_binary <- rma(yi, vi, data = es_binary, method = "REML")
  
  cat("\n📊 Results:\n")
  cat(sprintf("  Pooled OR: %.3f (95%% CI: %.3f - %.3f)\n", 
              exp(ma_binary$beta), exp(ma_binary$ci.lb), exp(ma_binary$ci.ub)))
  cat(sprintf("  z = %.3f, p = %.4f\n", ma_binary$zval, ma_binary$pval))
  cat(sprintf("  Heterogeneity: I² = %.1f%%, τ² = %.4f\n", 
              ma_binary$I2, ma_binary$tau2))
  cat(sprintf("  Q = %.2f, df = %d, p = %.4f\n", 
              ma_binary$QE, ma_binary$k - 1, ma_binary$QEp))
  
  # Generate Forest Plot
  png(file.path(output_dir, "test1_forest_binary.png"), 
      width = 1200, height = 800, res = 150)
  forest(ma_binary, 
         slab = binary_data$study,
         atransf = exp,
         xlab = "Odds Ratio",
         header = c("Study", "OR [95% CI]"),
         refline = 1,
         col = "steelblue",
         border = "steelblue")
  title("Forest Plot: Binary Outcome Meta-Analysis (Odds Ratio)")
  dev.off()
  
  results$tests$binary_or <- list(
    status = "PASSED",
    pooled_or = exp(ma_binary$beta),
    ci_lower = exp(ma_binary$ci.lb),
    ci_upper = exp(ma_binary$ci.ub),
    i_squared = ma_binary$I2,
    tau_squared = ma_binary$tau2,
    p_value = ma_binary$pval,
    k_studies = ma_binary$k,
    plot = "test1_forest_binary.png"
  )
  cat("\n✅ TEST 1 PASSED: Forest plot saved\n")
}, error = function(e) {
  results$tests$binary_or <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 1 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 2: Continuous Outcome Meta-Analysis (Standardized Mean Difference)
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 2: Continuous Outcome Meta-Analysis (SMD - Hedges' g)\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

# Sample data: Pain scores (VAS 0-10) comparing intervention vs control
continuous_data <- data.frame(
  study = c("Anderson 2019", "Thomas 2020", "Jackson 2020", "White 2021",
            "Harris 2021", "Martin 2022", "Thompson 2022", "Garcia 2023"),
  mean_treat = c(3.2, 2.8, 3.5, 2.9, 3.1, 2.7, 3.3, 2.5),
  sd_treat = c(1.5, 1.3, 1.6, 1.4, 1.5, 1.2, 1.4, 1.3),
  n_treat = c(45, 52, 38, 60, 48, 55, 42, 65),
  mean_ctrl = c(4.8, 4.2, 5.1, 4.5, 4.7, 4.0, 4.9, 4.3),
  sd_ctrl = c(1.6, 1.4, 1.7, 1.5, 1.6, 1.3, 1.5, 1.4),
  n_ctrl = c(43, 50, 40, 58, 50, 53, 44, 63)
)

tryCatch({
  # Calculate effect sizes (Hedges' g)
  es_cont <- escalc(measure = "SMD",
                    m1i = mean_treat, sd1i = sd_treat, n1i = n_treat,
                    m2i = mean_ctrl, sd2i = sd_ctrl, n2i = n_ctrl,
                    data = continuous_data)
  
  # Random-effects meta-analysis
  ma_cont <- rma(yi, vi, data = es_cont, method = "REML")
  
  cat("\n📊 Results:\n")
  cat(sprintf("  Pooled SMD (Hedges' g): %.3f (95%% CI: %.3f - %.3f)\n", 
              ma_cont$beta, ma_cont$ci.lb, ma_cont$ci.ub))
  cat(sprintf("  z = %.3f, p < 0.0001\n", ma_cont$zval))
  cat(sprintf("  Heterogeneity: I² = %.1f%%, τ² = %.4f\n", 
              ma_cont$I2, ma_cont$tau2))
  cat(sprintf("  Prediction interval: %.3f to %.3f\n",
              ma_cont$beta - 1.96 * sqrt(ma_cont$tau2 + ma_cont$se^2),
              ma_cont$beta + 1.96 * sqrt(ma_cont$tau2 + ma_cont$se^2)))
  
  # Generate Forest Plot
  png(file.path(output_dir, "test2_forest_smd.png"), 
      width = 1200, height = 800, res = 150)
  forest(ma_cont,
         slab = continuous_data$study,
         xlab = "Standardized Mean Difference (Hedges' g)",
         header = c("Study", "SMD [95% CI]"),
         refline = 0,
         col = "darkgreen",
         border = "darkgreen")
  title("Forest Plot: Continuous Outcome Meta-Analysis (SMD)")
  dev.off()
  
  results$tests$continuous_smd <- list(
    status = "PASSED",
    pooled_smd = as.numeric(ma_cont$beta),
    ci_lower = ma_cont$ci.lb,
    ci_upper = ma_cont$ci.ub,
    i_squared = ma_cont$I2,
    tau_squared = ma_cont$tau2,
    k_studies = ma_cont$k,
    plot = "test2_forest_smd.png"
  )
  cat("\n✅ TEST 2 PASSED: Forest plot saved\n")
}, error = function(e) {
  results$tests$continuous_smd <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 2 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 3: Publication Bias Assessment (Funnel Plot + Egger's Test)
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 3: Publication Bias Assessment\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  # Use the binary meta-analysis from Test 1
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_data)
  ma_binary <- rma(yi, vi, data = es_binary, method = "REML")
  
  # Egger's test for funnel plot asymmetry
  egger <- regtest(ma_binary, model = "lm")
  
  cat("\n📊 Egger's Test for Publication Bias:\n")
  cat(sprintf("  Intercept: %.3f (SE = %.3f)\n", egger$est, egger$se))
  cat(sprintf("  t = %.3f, p = %.4f\n", egger$zval, egger$pval))
  cat(sprintf("  Interpretation: %s\n", 
              ifelse(egger$pval < 0.1, "Possible publication bias detected", 
                     "No significant asymmetry detected")))
  
  # Generate Funnel Plot
  png(file.path(output_dir, "test3_funnel_plot.png"), 
      width = 1000, height = 800, res = 150)
  funnel(ma_binary, 
         xlab = "Log Odds Ratio",
         main = "Funnel Plot: Publication Bias Assessment",
         back = "white",
         shade = c("white", "gray90"),
         hlines = NULL)
  # Add Egger's regression line
  abline(a = 0, b = 0, lty = 2)
  dev.off()
  
  # Trim-and-fill analysis
  taf <- trimfill(ma_binary)
  cat(sprintf("\n📊 Trim-and-Fill Analysis:\n"))
  cat(sprintf("  Estimated missing studies: %d (side: %s)\n", 
              taf$k0, taf$side))
  cat(sprintf("  Adjusted OR: %.3f (95%% CI: %.3f - %.3f)\n",
              exp(taf$beta), exp(taf$ci.lb), exp(taf$ci.ub)))
  
  results$tests$publication_bias <- list(
    status = "PASSED",
    egger_intercept = egger$est,
    egger_p = egger$pval,
    asymmetry_detected = egger$pval < 0.1,
    trimfill_missing = taf$k0,
    trimfill_adjusted_or = exp(taf$beta),
    plot = "test3_funnel_plot.png"
  )
  cat("\n✅ TEST 3 PASSED: Funnel plot saved\n")
}, error = function(e) {
  results$tests$publication_bias <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 3 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 4: Subgroup Analysis
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 4: Subgroup Analysis\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  # Add subgroup variable to binary data
  binary_data$region <- c("Europe", "North America", "Europe", "North America",
                          "Asia", "Europe", "North America", "Asia")
  
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_data)
  
  # Subgroup meta-analysis
  ma_subgroup <- rma(yi, vi, data = es_binary, method = "REML", 
                     mods = ~ factor(region) - 1)
  
  cat("\n📊 Subgroup Results:\n")
  regions <- unique(binary_data$region)
  for (i in seq_along(regions)) {
    cat(sprintf("  %s: OR = %.3f (95%% CI: %.3f - %.3f)\n",
                regions[i], exp(ma_subgroup$beta[i]), 
                exp(ma_subgroup$ci.lb[i]), exp(ma_subgroup$ci.ub[i])))
  }
  
  # Test for subgroup differences
  ma_test <- rma(yi, vi, data = es_binary, method = "REML", 
                 mods = ~ factor(region))
  cat(sprintf("\n📊 Test for Subgroup Differences:\n"))
  cat(sprintf("  Q_M = %.2f, df = %d, p = %.4f\n", 
              ma_test$QM, ma_test$m, ma_test$QMp))
  
  # Generate subgroup forest plot
  png(file.path(output_dir, "test4_subgroup_forest.png"), 
      width = 1400, height = 1000, res = 150)
  
  # Order by region
  ord <- order(binary_data$region)
  forest(rma(yi, vi, data = es_binary[ord,], method = "REML"),
         slab = binary_data$study[ord],
         atransf = exp,
         xlab = "Odds Ratio",
         header = c("Study", "OR [95% CI]"),
         refline = 1,
         rows = c(1:3, 6:8, 11:12),
         ylim = c(-1, 16))
  
  # Add subgroup labels
  text(-6, c(4.5, 9.5, 13.5), pos = 4, font = 2,
       c("Asia", "Europe", "North America"))
  dev.off()
  
  results$tests$subgroup <- list(
    status = "PASSED",
    subgroups = regions,
    q_between = ma_test$QM,
    p_interaction = ma_test$QMp,
    plot = "test4_subgroup_forest.png"
  )
  cat("\n✅ TEST 4 PASSED: Subgroup forest plot saved\n")
}, error = function(e) {
  results$tests$subgroup <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 4 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 5: Sensitivity Analysis (Leave-One-Out)
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 5: Sensitivity Analysis (Leave-One-Out)\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_data)
  ma_binary <- rma(yi, vi, data = es_binary, method = "REML")
  
  # Leave-one-out analysis
  loo <- leave1out(ma_binary)
  
  cat("\n📊 Leave-One-Out Results:\n")
  cat("  Study Excluded       | Pooled OR  | 95% CI           | I²\n")
  cat("  ---------------------|------------|------------------|--------\n")
  for (i in 1:ma_binary$k) {
    cat(sprintf("  %-20s | %.3f      | (%.3f - %.3f)  | %.1f%%\n",
                binary_data$study[i], exp(loo$estimate[i]), 
                exp(loo$ci.lb[i]), exp(loo$ci.ub[i]), loo$I2[i]))
  }
  
  # Identify influential studies
  original_or <- exp(ma_binary$beta)
  influential <- which(abs(exp(loo$estimate) - original_or) / original_or > 0.1)
  if (length(influential) > 0) {
    cat(sprintf("\n⚠️  Potentially influential studies: %s\n",
                paste(binary_data$study[influential], collapse = ", ")))
  } else {
    cat("\n✓ No single study substantially influences the pooled estimate\n")
  }
  
  # Generate influence plot
  png(file.path(output_dir, "test5_influence_plot.png"), 
      width = 1200, height = 800, res = 150)
  
  # Create influence plot data
  inf_data <- data.frame(
    study = binary_data$study,
    estimate = exp(loo$estimate),
    ci_lb = exp(loo$ci.lb),
    ci_ub = exp(loo$ci.ub)
  )
  
  p <- ggplot(inf_data, aes(x = reorder(study, estimate), y = estimate)) +
    geom_point(size = 3, color = "steelblue") +
    geom_errorbar(aes(ymin = ci_lb, ymax = ci_ub), width = 0.2, color = "steelblue") +
    geom_hline(yintercept = original_or, linetype = "dashed", color = "red") +
    coord_flip() +
    labs(title = "Leave-One-Out Sensitivity Analysis",
         subtitle = "Red dashed line = overall pooled OR",
         x = "Study Excluded",
         y = "Pooled Odds Ratio") +
    theme_minimal() +
    theme(plot.title = element_text(face = "bold"))
  print(p)
  dev.off()
  
  results$tests$sensitivity <- list(
    status = "PASSED",
    original_or = original_or,
    range_or = c(min(exp(loo$estimate)), max(exp(loo$estimate))),
    influential_studies = if(length(influential) > 0) binary_data$study[influential] else "None",
    plot = "test5_influence_plot.png"
  )
  cat("\n✅ TEST 5 PASSED: Influence plot saved\n")
}, error = function(e) {
  results$tests$sensitivity <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 5 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 6: Risk of Bias Visualization
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 6: Risk of Bias Visualization\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  # Sample RoB 2 data
  rob_data <- data.frame(
    study = binary_data$study,
    D1_Randomization = c("Low", "Low", "Some concerns", "Low", "Low", "Some concerns", "Low", "Low"),
    D2_Deviations = c("Low", "Some concerns", "Low", "Low", "High", "Low", "Low", "Some concerns"),
    D3_Missing = c("Low", "Low", "Low", "Some concerns", "Low", "Low", "Low", "Low"),
    D4_Measurement = c("Low", "Low", "Low", "Low", "Low", "Some concerns", "Low", "Low"),
    D5_Selection = c("Low", "Low", "Low", "Low", "Low", "Low", "Some concerns", "Low"),
    Overall = c("Low", "Some concerns", "Some concerns", "Some concerns", "High", "Some concerns", "Some concerns", "Some concerns")
  )
  
  cat("\n📊 Risk of Bias Summary:\n")
  cat("  Domain                  | Low | Some concerns | High\n")
  cat("  ------------------------|-----|---------------|------\n")
  domains <- c("D1_Randomization", "D2_Deviations", "D3_Missing", "D4_Measurement", "D5_Selection", "Overall")
  domain_names <- c("Randomization", "Deviations", "Missing data", "Measurement", "Selection", "Overall")
  
  for (i in seq_along(domains)) {
    counts <- table(rob_data[[domains[i]]])
    low <- ifelse("Low" %in% names(counts), counts["Low"], 0)
    some <- ifelse("Some concerns" %in% names(counts), counts["Some concerns"], 0)
    high <- ifelse("High" %in% names(counts), counts["High"], 0)
    cat(sprintf("  %-22s |  %d  |      %d        |   %d\n", 
                domain_names[i], low, some, high))
  }
  
  # Generate traffic light plot
  png(file.path(output_dir, "test6_rob_traffic_light.png"), 
      width = 1400, height = 800, res = 150)
  
  # Reshape data for plotting
  rob_long <- tidyr::pivot_longer(rob_data, 
                                   cols = -study,
                                   names_to = "domain",
                                   values_to = "judgment")
  
  rob_long$domain <- factor(rob_long$domain, 
                            levels = domains,
                            labels = domain_names)
  
  rob_long$judgment <- factor(rob_long$judgment, 
                              levels = c("Low", "Some concerns", "High"))
  
  p <- ggplot(rob_long, aes(x = domain, y = study, fill = judgment)) +
    geom_tile(color = "white", size = 0.5) +
    scale_fill_manual(values = c("Low" = "#4CAF50", 
                                 "Some concerns" = "#FFC107", 
                                 "High" = "#F44336"),
                      name = "Judgment") +
    labs(title = "Risk of Bias Assessment (RoB 2)",
         subtitle = "Traffic Light Plot",
         x = "Domain",
         y = "Study") +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1),
          plot.title = element_text(face = "bold"),
          legend.position = "bottom")
  print(p)
  dev.off()
  
  # Generate summary bar plot
  png(file.path(output_dir, "test6_rob_summary.png"), 
      width = 1000, height = 600, res = 150)
  
  rob_summary <- rob_long %>%
    dplyr::group_by(domain, judgment) %>%
    dplyr::summarise(count = dplyr::n(), .groups = "drop") %>%
    dplyr::group_by(domain) %>%
    dplyr::mutate(pct = count / sum(count) * 100)
  
  p2 <- ggplot(rob_summary, aes(x = domain, y = pct, fill = judgment)) +
    geom_bar(stat = "identity", position = "stack") +
    scale_fill_manual(values = c("Low" = "#4CAF50", 
                                 "Some concerns" = "#FFC107", 
                                 "High" = "#F44336"),
                      name = "Judgment") +
    labs(title = "Risk of Bias Summary",
         x = "Domain",
         y = "Percentage (%)") +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1),
          plot.title = element_text(face = "bold"),
          legend.position = "bottom") +
    coord_flip()
  print(p2)
  dev.off()
  
  results$tests$risk_of_bias <- list(
    status = "PASSED",
    n_studies = nrow(rob_data),
    overall_low = sum(rob_data$Overall == "Low"),
    overall_some = sum(rob_data$Overall == "Some concerns"),
    overall_high = sum(rob_data$Overall == "High"),
    plots = c("test6_rob_traffic_light.png", "test6_rob_summary.png")
  )
  cat("\n✅ TEST 6 PASSED: RoB plots saved\n")
}, error = function(e) {
  results$tests$risk_of_bias <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 6 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 7: Meta-Regression
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 7: Meta-Regression\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_data)
  
  # Meta-regression with year as moderator
  ma_reg <- rma(yi, vi, data = es_binary, method = "REML", 
                mods = ~ year)
  
  cat("\n📊 Meta-Regression Results (Moderator: Publication Year):\n")
  cat(sprintf("  Intercept: %.3f (SE = %.3f)\n", ma_reg$beta[1], ma_reg$se[1]))
  cat(sprintf("  Year coefficient: %.4f (SE = %.4f)\n", ma_reg$beta[2], ma_reg$se[2]))
  cat(sprintf("  Test of moderator: Q_M = %.2f, p = %.4f\n", ma_reg$QM, ma_reg$QMp))
  cat(sprintf("  Residual heterogeneity: I² = %.1f%%, τ² = %.4f\n", 
              ma_reg$I2, ma_reg$tau2))
  cat(sprintf("  R² = %.1f%% (variance explained by moderator)\n", 
              max(0, (1 - ma_reg$tau2 / rma(yi, vi, data = es_binary)$tau2) * 100)))
  
  # Generate bubble plot
  png(file.path(output_dir, "test7_meta_regression.png"), 
      width = 1000, height = 800, res = 150)
  
  # Calculate weights for bubble sizes
  weights <- 1 / es_binary$vi
  weights_scaled <- (weights - min(weights)) / (max(weights) - min(weights)) * 10 + 2
  
  plot_data <- data.frame(
    year = binary_data$year,
    log_or = es_binary$yi,
    weight = weights_scaled
  )
  
  p <- ggplot(plot_data, aes(x = year, y = log_or)) +
    geom_point(aes(size = weight), alpha = 0.6, color = "steelblue") +
    geom_smooth(method = "lm", se = TRUE, color = "darkred", fill = "pink") +
    geom_hline(yintercept = 0, linetype = "dashed", color = "gray50") +
    scale_size_continuous(range = c(3, 12), guide = "none") +
    labs(title = "Meta-Regression: Effect Size by Publication Year",
         subtitle = sprintf("Slope = %.4f, p = %.4f", ma_reg$beta[2], ma_reg$QMp),
         x = "Publication Year",
         y = "Log Odds Ratio") +
    theme_minimal() +
    theme(plot.title = element_text(face = "bold"))
  print(p)
  dev.off()
  
  results$tests$meta_regression <- list(
    status = "PASSED",
    intercept = ma_reg$beta[1],
    slope = ma_reg$beta[2],
    p_moderator = ma_reg$QMp,
    r_squared = max(0, (1 - ma_reg$tau2 / rma(yi, vi, data = es_binary)$tau2) * 100),
    plot = "test7_meta_regression.png"
  )
  cat("\n✅ TEST 7 PASSED: Meta-regression plot saved\n")
}, error = function(e) {
  results$tests$meta_regression <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 7 FAILED: %s\n", e$message))
})

# ============================================================================
# TEST 8: Cumulative Meta-Analysis
# ============================================================================
cat("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("TEST 8: Cumulative Meta-Analysis\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

tryCatch({
  # Order by year
  binary_ordered <- binary_data[order(binary_data$year), ]
  
  es_binary <- escalc(measure = "OR", 
                      ai = events_treat, n1i = n_treat,
                      ci = events_ctrl, n2i = n_ctrl,
                      data = binary_ordered)
  ma_binary <- rma(yi, vi, data = es_binary, method = "REML")
  
  # Cumulative meta-analysis
  cum <- cumul(ma_binary, order = order(binary_ordered$year))
  
  cat("\n📊 Cumulative Meta-Analysis Results:\n")
  cat("  Year | Studies | Cumulative OR | 95% CI\n")
  cat("  -----|---------|---------------|------------------\n")
  for (i in 1:ma_binary$k) {
    cat(sprintf("  %d |    %d    |     %.3f     | (%.3f - %.3f)\n",
                binary_ordered$year[i], i, exp(cum$estimate[i]),
                exp(cum$ci.lb[i]), exp(cum$ci.ub[i]))
  )}
  
  # Generate cumulative forest plot
  png(file.path(output_dir, "test8_cumulative_forest.png"), 
      width = 1200, height = 800, res = 150)
  forest(cum, 
         atransf = exp,
         xlab = "Cumulative Odds Ratio",
         header = c("Studies Added", "OR [95% CI]"),
         refline = 1,
         col = "purple",
         border = "purple")
  title("Cumulative Meta-Analysis by Publication Year")
  dev.off()
  
  results$tests$cumulative <- list(
    status = "PASSED",
    final_or = exp(cum$estimate[nrow(cum)]),
    ci_lower = exp(cum$ci.lb[nrow(cum)]),
    ci_upper = exp(cum$ci.ub[nrow(cum)]),
    plot = "test8_cumulative_forest.png"
  )
  cat("\n✅ TEST 8 PASSED: Cumulative forest plot saved\n")
}, error = function(e) {
  results$tests$cumulative <- list(status = "FAILED", error = e$message)
  cat(sprintf("\n❌ TEST 8 FAILED: %s\n", e$message))
})

# ============================================================================
# SUMMARY REPORT
# ============================================================================
cat("\n")
cat("╔══════════════════════════════════════════════════════════════════════╗\n")
cat("║                        TEST SUMMARY REPORT                          ║\n")
cat("╚══════════════════════════════════════════════════════════════════════╝\n")
cat("\n")

# Count results
passed <- sum(sapply(results$tests, function(x) x$status == "PASSED"))
failed <- sum(sapply(results$tests, function(x) x$status == "FAILED"))
total <- length(results$tests)

cat(sprintf("Total Tests: %d\n", total))
cat(sprintf("Passed: %d ✅\n", passed))
cat(sprintf("Failed: %d ❌\n", failed))
cat(sprintf("Success Rate: %.1f%%\n", passed / total * 100))
cat("\n")

# List all generated plots
cat("Generated Plots:\n")
plots <- list.files(output_dir, pattern = "\\.png$", full.names = FALSE)
for (plot in plots) {
  cat(sprintf("  📊 %s\n", plot))
}

# Save results as JSON
results$summary <- list(
  total_tests = total,
  passed = passed,
  failed = failed,
  success_rate = passed / total * 100,
  plots_generated = plots
)

writeLines(toJSON(results, pretty = TRUE, auto_unbox = TRUE),
           file.path(output_dir, "test_results.json"))

cat("\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
cat("Results saved to: ", output_dir, "\n")
cat("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
