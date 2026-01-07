# BYOK API Research

## MiniMax M2.1 API

**Base URL (International):** `https://api.minimax.io/anthropic`
**Base URL (China):** `https://api.minimaxi.com/anthropic`

**Authentication:** API key via `ANTHROPIC_API_KEY` header (uses Anthropic SDK compatible format)

**Supported Models:**
- `MiniMax-M2.1` - Full model with thinking/reasoning
- `MiniMax-M2.1-lightning` - Faster variant
- `MiniMax-M2` - Previous version

**Key Features:**
- Compatible with Anthropic SDK (recommended)
- Compatible with OpenAI SDK
- Supports streaming responses
- Supports tool use and interleaved thinking
- Temperature range: (0.0, 1.0]

**Usage Example:**
```python
import anthropic

client = anthropic.Anthropic(
    base_url="https://api.minimax.io/anthropic",
    api_key="YOUR_API_KEY"
)

message = client.messages.create(
    model="MiniMax-M2.1",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[{"role": "user", "content": "Hello"}]
)
```

## OpenAI API

**Base URL:** `https://api.openai.com/v1`
**Authentication:** Bearer token via `Authorization` header

**Models:**
- `gpt-4o` - Latest multimodal
- `gpt-4o-mini` - Faster/cheaper
- `gpt-4-turbo` - Previous flagship
- `gpt-3.5-turbo` - Budget option

## Anthropic API

**Base URL:** `https://api.anthropic.com`
**Authentication:** `x-api-key` header

**Models:**
- `claude-sonnet-4-20250514` - Latest Sonnet
- `claude-3-5-sonnet-20241022` - Previous Sonnet
- `claude-3-opus-20240229` - Most capable
- `claude-3-haiku-20240307` - Fastest

## Google Gemini API

**Base URL:** `https://generativelanguage.googleapis.com/v1beta`
**Authentication:** API key as query parameter or header

**Models:**
- `gemini-2.0-flash` - Latest fast model
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Fast and efficient

## OpenRouter API

**Base URL:** `https://openrouter.ai/api/v1`
**Authentication:** Bearer token via `Authorization` header

**Key Features:**
- Access to 100+ models from multiple providers
- Single API key for all models
- Automatic fallback and load balancing
- Usage tracking across providers

**Models (examples):**
- `anthropic/claude-sonnet-4`
- `openai/gpt-4o`
- `google/gemini-2.0-flash`
- `meta-llama/llama-3.1-405b`
- `mistralai/mistral-large`

## Implementation Plan

1. **Secure Storage:** Use `expo-secure-store` for API keys
2. **Provider Interface:** Common interface for all providers
3. **Validation:** Test API key on save
4. **Fallback Chain:** User keys → Built-in → Local model → Templates
