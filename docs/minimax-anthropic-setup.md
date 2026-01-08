# MiniMax Anthropic-Compatible API Setup

## Configuration

For international users:
```bash
export ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic
export ANTHROPIC_API_KEY=${YOUR_API_KEY}
```

For users in China:
```bash
export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
export ANTHROPIC_API_KEY=${YOUR_API_KEY}
```

## Supported Models
- MiniMax-M2.1
- MiniMax-M2.1-lightning
- MiniMax-M2

## Example Usage (Python)

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="MiniMax-M2.1",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)

for block in message.content:
    if block.type == "thinking":
        print(f"Thinking:\n{block.thinking}\n")
    elif block.type == "text":
        print(f"Text:\n{block.text}\n")
```

## Important Notes
1. Temperature range: (0.0, 1.0]
2. Image and document inputs not currently supported
3. Some Anthropic parameters ignored: thinking, top_k, stop_sequences, service_tier, mcp_servers
