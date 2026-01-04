# Open-Source LLM Research Notes

## Key Finding: DeepSeek R1 - Model of the Year 2025

From Sebastian Raschka's "State of LLMs 2025":

### DeepSeek R1 Highlights
- Released as open-weight model
- Comparable to best proprietary models (ChatGPT, Gemini)
- Training cost much lower than expected (~$5M vs $50-500M assumed)
- R1 training on top of V3 cost only ~$294,000
- Uses RLVR (Reinforcement Learning with Verifiable Rewards) with GRPO algorithm
- Excellent for reasoning tasks (math, code, expandable to other domains)

### Why DeepSeek R1 Matters for Our Use Case
1. Open weights - can be self-hosted
2. Strong reasoning capabilities - important for meta-analysis methodology decisions
3. Cost-effective to run
4. RLVR approach means it can learn complex problem-solving

## Models to Compare
- DeepSeek R1 (671B parameters, but distilled versions available)
- DeepSeek R1 Distill Qwen variants (1.5B, 7B, 14B, 32B)
- Qwen 2.5 (72B, 32B, 14B, 7B)
- Llama 3.x series
- Mistral 3
- Kimi K2

## Key Insights from Sebastian Raschka's "State of LLMs 2025"
Source: https://magazine.sebastianraschka.com/p/state-of-llms-2025

### 2025 Was the Year of Reasoning Models
- DeepSeek R1 was the breakthrough - open-weight model comparable to proprietary (ChatGPT, Gemini)
- RLVR (Reinforcement Learning with Verifiable Rewards) + GRPO algorithm dominated 2025
- Training costs much lower than expected (~$5M for V3, ~$294K for R1 on top)
- Reasoning = model explains its answer, which improves accuracy

### LLM Development Focus by Year
- 2022: RLHF + PPO
- 2023: LoRA SFT
- 2024: Mid-Training (synthetic data, data mixes, long-context)
- 2025: RLVR + GRPO

### Why DeepSeek R1 Matters for Open-Source Fallback
1. Open weights - can be self-hosted or accessed via API providers
2. Strong reasoning capabilities - important for meta-analysis methodology
3. RLVR approach works well for verifiable domains (math, code, potentially statistics)
4. Distilled versions available (1.5B, 7B, 14B, 32B based on Qwen)

## Next: Need to research
- Distilled model performance vs full model
- Resource requirements for each
- API providers for open models (Together AI, Groq, etc.)
- Medical/scientific domain performance
- Qwen 2.5 vs DeepSeek R1 distill comparison

## Key Insights from "2025 Open Models Year in Review" (Interconnects)
Source: https://www.interconnects.ai/p/2025-open-models-year-in-review

### Top Models of 2025 (Winners)
1. **DeepSeek R1** - Most impactful release of the year, MIT license, inspired Chinese labs to open their models
2. **Qwen 3** - Covers everything (dense, MoE, vision, omni, coding, embedding, reranker), overtaken Llama in downloads, most-used base model for fine-tuning, excellent multilinguality
3. **Kimi K2** - Loved for performance and distinct writing style

### Runner Ups
- **MiniMax M2** - Surprising leap in capability, one of most-used on OpenRouter
- **GLM-4.5** - Zhipu's breakthrough moment
- **GPT-OSS** - OpenAI's open model, strong for agentic apps, pioneered thinking levels
- **Gemma 3** - Strong multilingual at <30B, good vision capabilities
- **Olmo 3** - Ai2's fully open model (data, code, weights, logs), crucial for researchers

### Honorable Mentions
- **Parakeet 3** - Excellent speech-to-text, fast on MacBook, beats cloud latency

### Key Takeaway for Our Use Case
- **Qwen 3** is the best choice for open-source fallback:
  - Overtaken Llama in downloads and usage
  - Excellent multilinguality (important for global accessibility)
  - Multiple sizes available (dense and MoE)
  - Strong academic adoption
  - Good for fine-tuning
- **DeepSeek R1 distilled versions** are also excellent for reasoning tasks
- Qwen has become the default for academic experiments

## Benchmark Comparison: Gemini 2.5 Flash vs Qwen 3

### Performance
- Gemini 2.5 Flash outperforms Qwen3 on AIME 2024, AIME 2025, GPQA benchmarks
- Gemini 2.5 Flash has ~9.4% higher average benchmark score
- Gemini 2.5 Flash has 858K more tokens context window
- However, Qwen3 is significantly cheaper:
  - Qwen3 235B: ~1.7x cheaper for input, ~4.6x cheaper for output vs Gemini 2.5 Flash

### API Providers for Open Models
1. **OpenRouter** (https://openrouter.ai) - Unified API for all models
   - Qwen3 32B available
   - Multiple providers (Groq, Together AI, etc.)
   - Pay-as-you-go
   
2. **Groq** - Ultra-fast inference with custom hardware
   - Supports Qwen, Llama, Mixtral
   - Very low latency
   
3. **Together AI** - Strong open model support
   - Good for fine-tuning
   - Competitive pricing

4. **SambaNova** - Proprietary hardware, fast inference

### Medical/Scientific Domain
From Harvard Medical School research (Mar 2025):
- "Open-source AI matches top proprietary LLM in solving tough medical cases"
- Open-source models now competitive for complex clinical reasoning

Top recommendations for medical (2025):
1. GPT-OSS-120B
2. DeepSeek-R1
3. GLM-4.5V

## Recommendation for Meta Agent Fallback

### Primary Recommendation: **Qwen3 32B** via OpenRouter
**Rationale:**
1. Strong reasoning capabilities (important for meta-analysis methodology)
2. Excellent multilinguality (global accessibility)
3. Cost-effective (~4-5x cheaper than Gemini)
4. Available via multiple providers (redundancy)
5. Good for instruction-following and teaching
6. Active development and community support

### Alternative: **DeepSeek R1 Distilled (32B)**
**Rationale:**
1. MIT license - truly open
2. Excellent reasoning (RLVR trained)
3. Distilled versions available (1.5B, 7B, 14B, 32B)
4. Can run locally on consumer hardware

### Implementation Strategy
1. Primary: Gemini 2.5 Flash (best performance)
2. Fallback 1: Qwen3 32B via OpenRouter (cost-effective, good performance)
3. Fallback 2: DeepSeek R1 Distilled via local/API (fully free option)

