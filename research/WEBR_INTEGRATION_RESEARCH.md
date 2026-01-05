# WebR Integration Research for Meta Agent Mobile

## Executive Summary

**WebR is VIABLE for Meta Agent Mobile.** The metafor package is available pre-compiled for WebAssembly via R-universe, and WebR provides a well-documented JavaScript API for integration.

---

## Key Findings

### 1. WebR Overview

WebR is R compiled to WebAssembly (WASM) via Emscripten. It allows running R code directly in browsers and Node.js without a server.

**Official Resources:**
- Documentation: https://docs.r-wasm.org/webr/latest/
- GitHub: https://github.com/r-wasm/webr/
- Package Repository: https://repo.r-wasm.org/

### 2. metafor Package Availability ✅

**CONFIRMED: metafor is available for WebR!**

- R-universe builds metafor for WebAssembly: https://wviechtb.r-universe.dev/metafor
- Version 4.9-29 (as of Dec 2025)
- All 4 packages from Wolfgang Viechtbauer are built for WASM:
  - metafor (meta-analysis)
  - mathjaxr (math rendering)
  - metadat (meta-analysis datasets)
  - plotannotate (plot annotations)

**Installation in WebR:**
```r
webr::install("metafor")
# Or from R-universe:
install.packages('metafor', repos = c('https://wviechtb.r-universe.dev', 'https://cloud.r-project.org'))
```

### 3. React Native Integration Options

#### Option A: Polygen (Recommended for Performance)
- **What:** Toolkit for running WASM in React Native with near-native performance
- **How:** Compiles WASM to C code at build time (AOT compilation)
- **Pros:** Near-native performance, App Store compliant
- **Cons:** iOS only (currently), no dynamic module loading
- **Status:** First public release Feb 2025
- **Source:** https://github.com/nicolo-ribaudo/polygen (Callstack)

#### Option B: react-native-webassembly
- **What:** WASM runtime using wasm3 interpreter
- **How:** Interprets WASM at runtime
- **Pros:** Works on iOS and Android
- **Cons:** Slower than native (interpretation overhead)
- **Source:** https://github.com/nicolo-ribaudo/react-native-webassembly

#### Option C: WebView Bridge
- **What:** Run WebR in a WebView, bridge to React Native
- **How:** Load WebR in hidden WebView, communicate via postMessage
- **Pros:** Simplest to implement, full WebR compatibility
- **Cons:** Memory overhead, communication latency
- **Best for:** Proof of concept, quick prototyping

### 4. WebR JavaScript API

```typescript
import { WebR } from 'webr';

// Initialize WebR
const webR = new WebR();
await webR.init();

// Install packages
await webR.installPackages(['metafor']);

// Run R code
const result = await webR.evalR(`
  library(metafor)
  dat <- escalc(measure="OR", ai=tpos, bi=tneg, ci=cpos, di=cneg, data=dat.bcg)
  res <- rma(yi, vi, data=dat)
  summary(res)
`);

// Get output
const output = await result.toJs();
```

### 5. Performance Expectations

| Metric | Native R | WebR (WASM) | Notes |
|--------|----------|-------------|-------|
| Startup | ~1s | ~3-5s | Initial load + package loading |
| Simple calc | 1x | 2-3x slower | Acceptable for meta-analysis |
| Complex model | 1x | 2-3x slower | Still usable |
| Memory | ~100MB | ~150-200MB | WASM has overhead |
| Package size | N/A | ~50MB | WebR core + metafor |

### 6. Limitations

1. **No source installation:** Cannot compile packages from source in WebR
2. **Memory limits:** Mobile browsers restrict WASM memory (varies by device)
3. **No file system:** Must use virtual filesystem (Emscripten FS)
4. **No network:** R's download functions don't work; use JS fetch instead
5. **Plotting:** Works but requires canvas/SVG output handling

### 7. Mobile Considerations

From WebR docs:
> "Some browsers (especially mobile browsers) may place restrictive limits on the amount of RAM provided to WebAssembly regardless of the amount of memory available on the host device."

**Mitigation:**
- Pre-bundle packages to reduce download size
- Lazy-load packages as needed
- Clear R environment between analyses
- Use efficient data structures

---

## Recommended Implementation Plan

### Phase 1: Proof of Concept (WebView Bridge)
1. Create hidden WebView with WebR loaded
2. Implement JS bridge for R code execution
3. Test metafor forest plot generation
4. Measure performance and memory usage

### Phase 2: Optimize (Polygen or Native)
1. If PoC successful, evaluate Polygen for iOS
2. For Android, use react-native-webassembly
3. Pre-bundle metafor and dependencies
4. Implement caching for package data

### Phase 3: Production
1. Add error handling and recovery
2. Implement progress indicators for long operations
3. Add memory management (garbage collection)
4. Test on low-end devices

---

## Next Steps

1. **Create WebR PoC in React Native** using WebView approach
2. **Test metafor package loading** and basic meta-analysis
3. **Generate forest plot** and capture output
4. **Benchmark performance** on mobile devices
5. **Document findings** and decide on final approach

---

## References

1. WebR Documentation: https://docs.r-wasm.org/webr/latest/
2. Polygen Announcement: https://www.callstack.com/blog/bringing-webassembly-to-react-native-with-polygen
3. metafor on R-universe: https://wviechtb.r-universe.dev/metafor
4. rwasm Package: https://r-wasm.github.io/rwasm/


---

# Mobile Small Language Model (SLM) Research

## Executive Summary

Running LLMs locally on mobile is **challenging but feasible** with the right model and framework. For Meta Agent Mobile, we should use **Qwen 2.5 Coder 3B** (Q4 quantized at ~2GB) with **MLC-LLM** or **ONNX Runtime**.

---

## Key Findings

### 1. Qwen 2.5 Coder 3B - Best Option for Mobile

**Model Details:**
- Parameters: 3.09B (2.77B non-embedding)
- Context Length: 32,768 tokens
- Architecture: Transformers with RoPE, SwiGLU, RMSNorm
- Trained on: 5.5 trillion tokens of source code

**GGUF Quantization Options:**

| Quantization | Size | Quality | Mobile Viable |
|--------------|------|---------|---------------|
| Q2_K | 1.38 GB | Lower | ✅ Best for low-end |
| Q3_K_M | 1.72 GB | Moderate | ✅ Good balance |
| Q4_0 | 2.0 GB | Good | ✅ Recommended |
| Q4_K_M | 2.1 GB | Better | ✅ Recommended |
| Q5_K_M | 2.44 GB | High | ⚠️ High-end only |
| Q8_0 | 3.62 GB | Highest | ❌ Too large |

**Recommendation:** Use **Q4_K_M** (2.1 GB) for best quality/size balance.

### 2. Alternative Models

| Model | Size | Params | Specialty |
|-------|------|--------|-----------|
| Phi-3.5 Mini | ~2.5 GB | 3.8B | Reasoning, general |
| Gemma 2 2B | ~1.5 GB | 2B | Lightweight, fast |
| DeepSeek-R1-Distill-Qwen-1.5B | ~1 GB | 1.5B | Smallest viable |
| Qwen 2.5 Coder 0.5B | ~0.5 GB | 0.5B | Very fast, lower quality |

### 3. Mobile Inference Frameworks

| Framework | Platforms | Pros | Cons |
|-----------|-----------|------|------|
| **MLC-LLM** | iOS, Android | Best optimization, GPU acceleration | Complex setup |
| **ONNX Runtime** | iOS, Android, Web | Cross-platform, well-documented | Moderate speed |
| **ExecuTorch** | iOS, Android | Meta's official, PyTorch native | Newer, less mature |
| **LiteRT** | iOS, Android | Google's TensorFlow Lite | Limited LLM support |
| **Core ML** | iOS only | Best iOS performance | Apple-only |
| **llama.cpp** | All | Simple, CPU-focused | Less GPU optimization |

**Recommendation:** Use **MLC-LLM** for best mobile performance.

### 4. Practical Considerations (from Callstack)

**Current Challenges:**
1. **Model Size:** Even 1.5B models are 3.5GB unquantized
2. **Model Formats:** Need conversion (Safetensors → GGUF/ONNX)
3. **Performance Trade-offs:** Speed vs quality vs battery
4. **Device Heating:** Intensive inference causes thermal throttling

**Delivery Options:**
1. Bundle with app (iOS limit: 4GB)
2. Download after install (requires hosting)
3. User provides model (tech-savvy users only)

**Reality Check:**
> "Currently, this technology is the worst it will ever be, and it's pretty impressive already."

### 5. React Native Integration Options

**Option A: MLC-LLM Native Module**
```typescript
// Callstack's approach
import { MLCEngine } from 'react-native-mlc-llm';

const engine = new MLCEngine('qwen2.5-coder-3b-q4');
await engine.load();
const response = await engine.generate('Write R code for forest plot');
```

**Option B: ONNX Runtime**
```typescript
import { InferenceSession } from 'onnxruntime-react-native';

const session = await InferenceSession.create('model.onnx');
const output = await session.run(inputs);
```

**Option C: WebView + Transformers.js**
```typescript
// Run in WebView with @xenova/transformers
// Simpler but slower
```

### 6. Performance Expectations

| Device | Model | Tokens/sec | Usable? |
|--------|-------|------------|---------|
| iPhone 15 Pro | Qwen 3B Q4 | ~15-20 | ✅ Good |
| iPhone 13 | Qwen 3B Q4 | ~8-12 | ✅ Acceptable |
| Pixel 8 | Qwen 3B Q4 | ~12-18 | ✅ Good |
| Mid-range Android | Qwen 3B Q4 | ~5-8 | ⚠️ Slow |
| Low-end Android | Qwen 1.5B Q4 | ~3-5 | ⚠️ Very slow |

### 7. Recommended Architecture for Meta Agent

```
┌─────────────────────────────────────────────────────────────┐
│                 META AGENT LLM ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIER 1: Cloud LLM (Default, Best Quality)                 │
│  ├── Gemini 2.5 Flash (current)                            │
│  ├── MiniMax-M2 API (open-source alternative)              │
│  └── Anthropic Claude (optional premium)                   │
│                                                             │
│  TIER 2: On-Device SLM (Offline Fallback)                  │
│  ├── Qwen 2.5 Coder 3B Q4 (~2GB download)                  │
│  ├── Loaded via MLC-LLM or ONNX Runtime                    │
│  └── For: R code generation, simple queries                │
│                                                             │
│  TIER 3: Tiny Model (Ultra-Lightweight)                    │
│  ├── Qwen 2.5 0.5B or Phi-3 Mini                           │
│  └── For: Autocomplete, quick suggestions                  │
│                                                             │
│  FALLBACK: Rule-Based Templates                            │
│  └── Pre-written R code templates for common analyses      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Cloud-First (Current)
- Keep Gemini 2.5 Flash as primary
- Add MiniMax-M2 API as open-source fallback
- No local model yet

### Phase 2: On-Device Prototype
1. Integrate MLC-LLM or ONNX Runtime
2. Download Qwen 2.5 Coder 3B Q4 on first launch
3. Use for offline R code generation
4. Benchmark on various devices

### Phase 3: Hybrid Intelligence
1. Smart routing: cloud for complex, local for simple
2. Caching: store common responses locally
3. Progressive enhancement: better models on better devices

---

## References

1. Qwen 2.5 Coder GGUF: https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF
2. Callstack Local LLMs: https://www.callstack.com/blog/local-llms-on-mobile-are-a-gimmick
3. MLC-LLM: https://mlc.ai/mlc-llm/
4. ONNX Runtime Mobile: https://onnxruntime.ai/docs/tutorials/mobile/
5. Phi-3.5 ONNX: https://huggingface.co/microsoft/Phi-3.5-mini-instruct-onnx
