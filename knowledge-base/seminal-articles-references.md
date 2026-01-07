# Seminal Articles in Meta-Analysis

This document provides references and key concepts from foundational papers in meta-analysis methodology.

## 1. Gene V. Glass (1976) - Origin of "Meta-Analysis"

**Citation:** Glass, G.V. (1976). Primary, Secondary, and Meta-Analysis of Research. *Educational Researcher*, 5(10), 3-8.

**Cited by:** 11,131+ times

**Key Contributions:**
- Coined the term "meta-analysis"
- Defined three levels of data analysis:
  - **Primary analysis**: Original analysis of data in a research study
  - **Secondary analysis**: Re-analysis of data for answering original or new questions
  - **Meta-analysis**: Analysis of analyses; statistical analysis of a large collection of results from individual studies for the purpose of integrating findings

**Historical Significance:** This paper established meta-analysis as a formal methodology for synthesizing research findings across multiple studies.

---

## 2. DerSimonian & Laird (1986) - Random Effects Model

**Citation:** DerSimonian, R., & Laird, N. (1986). Meta-analysis in clinical trials. *Controlled Clinical Trials*, 7(3), 177-188.

**Cited by:** 41,786+ times (one of the most cited statistical papers ever)

**Key Contributions:**
- Introduced the random effects approach to meta-analysis
- Developed method for incorporating heterogeneity between studies
- Provided practical method for estimating between-study variance (τ²)

**The DerSimonian-Laird Method:**
- Assumes true effects vary across studies
- Weights studies by inverse of total variance (within-study + between-study)
- More conservative than fixed-effect when heterogeneity exists
- Formula: τ² = max(0, (Q - df) / C)

**When to Use:**
- When studies are not functionally identical
- When generalization beyond included studies is desired
- When heterogeneity is expected or observed

---

## 3. Higgins & Thompson (2002) - I² Statistic

**Citation:** Higgins, J.P.T., & Thompson, S.G. (2002). Quantifying heterogeneity in a meta-analysis. *Statistics in Medicine*, 21(11), 1539-1558.

**Cited by:** 35,888+ times

**Key Contributions:**
- Developed I² statistic for quantifying heterogeneity
- Proposed H statistic (square root of Q/df)
- Provided measures independent of number of studies

**The I² Statistic:**
- Formula: I² = 100% × (Q - df) / Q
- Interpretation:
  - **0-25%**: Low heterogeneity
  - **25-50%**: Moderate heterogeneity
  - **50-75%**: Substantial heterogeneity
  - **75-100%**: Considerable heterogeneity

**Advantages over Q statistic:**
- Not dependent on number of studies
- Expressed as percentage (intuitive)
- Comparable across meta-analyses

---

## 4. Higgins et al. (2003) - Measuring Inconsistency

**Citation:** Higgins, J.P.T., Thompson, S.G., Deeks, J.J., & Altman, D.G. (2003). Measuring inconsistency in meta-analyses. *BMJ*, 327(7414), 557-560.

**Cited by:** 62,216+ times (most cited meta-analysis methods paper)

**Key Contributions:**
- Practical guidance on interpreting I²
- Confidence intervals for I²
- Relationship between I² and prediction intervals

**Key Message:** I² describes the percentage of variability in effect estimates that is due to heterogeneity rather than sampling error (chance).

---

## 5. Additional Foundational References

### Cochran (1954) - Q Statistic
- Cochran, W.G. (1954). The combination of estimates from different experiments. *Biometrics*, 10(1), 101-129.
- Introduced the Q test for heterogeneity

### Hedges & Olkin (1985) - Statistical Methods
- Hedges, L.V., & Olkin, I. (1985). *Statistical Methods for Meta-Analysis*. Academic Press.
- Comprehensive textbook on meta-analysis methods
- Introduced Hedges' g (bias-corrected effect size)

### Borenstein et al. (2009) - Modern Introduction
- Borenstein, M., Hedges, L.V., Higgins, J.P.T., & Rothstein, H.R. (2009). *Introduction to Meta-Analysis*. Wiley.
- Standard modern textbook

---

## Key Formulas Summary

| Concept | Formula | Reference |
|---------|---------|-----------|
| Hedges' g | g = d × J(df) | Hedges (1981) |
| Q statistic | Q = Σwᵢ(θᵢ - θ̄)² | Cochran (1954) |
| I² | I² = (Q - df)/Q × 100% | Higgins & Thompson (2002) |
| τ² (DL) | τ² = (Q - df)/C | DerSimonian & Laird (1986) |
| Random effects weight | wᵢ* = 1/(vᵢ + τ²) | DerSimonian & Laird (1986) |

---

## Teaching Notes for Glass 🦊

When teaching these concepts, emphasize:

1. **Historical context**: Meta-analysis emerged from education research (Glass) and was quickly adopted in medicine
2. **Why random effects matter**: Real-world studies are never identical
3. **I² interpretation**: Not a measure of effect size variation, but proportion of observed variance due to true heterogeneity
4. **Practical implications**: High I² suggests exploring moderators or subgroups
