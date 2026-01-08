# MiniMax Connector & Glass Integration
## Presentation Script for Meta Agent Mobile

**Author:** Manus AI  
**Date:** January 7, 2026  
**Duration:** ~15 minutes

---

## Opening (1 minute)

Good morning/afternoon everyone. Today I'm excited to present how we've integrated MiniMax's powerful AI capabilities into Glass, our friendly fox mascot and AI teaching assistant for meta-analysis education.

Glass isn't just a static character—she's a fully voiced, animated, multilingual AI tutor that can speak, show, and teach. Let me walk you through how MiniMax makes this possible.

---

## Section 1: Meet Glass 🦊 (2 minutes)

### Who is Glass?

Glass is named after **Gene Glass**, the statistician who coined the term "meta-analysis" in 1976. She's designed as a **Zenko**—a benevolent fox spirit from Japanese mythology known for guiding and protecting those who seek knowledge.

### Glass's Mission

> "Democratizing meta-analysis education through AI-powered, personalized learning experiences accessible to anyone with a smartphone."

Glass serves as the primary interface between students and our 13 AgentSkills curriculum, covering everything from basic effect sizes to advanced Bayesian meta-analysis.

---

## Section 2: MiniMax Connector Overview (3 minutes)

### What is MiniMax?

MiniMax is a multimodal AI platform offering state-of-the-art capabilities in voice synthesis, image generation, video creation, and music composition. Their MCP (Model Context Protocol) connector provides seamless integration with AI agents.

### Available Tools

| Tool | Function | Glass Application |
|------|----------|-------------------|
| `text_to_audio` | Text-to-speech with 250+ voices | Glass speaks in Portuguese, English, Spanish, and 20+ languages |
| `list_voices` | Retrieve available voice options | Select appropriate voice for each language/emotion |
| `voice_clone` | Create custom voices from audio samples | Future: Personalized Glass voice |
| `text_to_image` | Generate images from text prompts | Educational illustrations, diagrams, mascot variations |
| `generate_video` | Create videos (text-to-video, image-to-video) | Animated Glass tutorials, concept explanations |
| `music_generation` | AI music composition with lyrics | Educational jingles, celebration sounds |
| `voice_design` | Design new voices from descriptions | Create unique Glass voice personality |
| `play_audio` | Audio playback utility | Preview generated audio |
| `query_video_generation` | Check video generation status | Monitor async video tasks |

### Technical Integration

The MiniMax connector is accessed via MCP (Model Context Protocol), allowing Glass to:

1. **Request voice synthesis** in real-time during lessons
2. **Generate visual aids** on-demand for complex concepts
3. **Create animated explanations** for statistical procedures
4. **Adapt to user's language** automatically

---

## Section 3: Voice Capabilities Deep Dive (3 minutes)

### Multilingual Support

Glass can speak in **25+ languages** with native-quality voices:

| Language | Voice Examples | Use Case |
|----------|---------------|----------|
| Portuguese (BR) | SweetGirl, Jovialman, Narrator | Primary for Latin America |
| English | ExpressiveNarrator, WiseScholar | International users |
| Spanish | SereneWoman, CaptivatingStoryteller | Spanish-speaking regions |
| Japanese | GentleButler, KindLady | Asian market expansion |
| Korean | WiseTeacher, SweetGirl | K-education market |
| Chinese | GentleYouth, WarmGirl | Largest potential market |

### Voice Parameters

Each voice can be customized with:

- **Speed**: 0.5x to 2.0x (default: 1.0)
- **Volume**: 0 to 10 (default: 1)
- **Pitch**: -12 to +12 semitones (default: 0)
- **Emotion**: happy, sad, angry, fearful, disgusted, surprised, neutral

### Demo: Glass Introduction (Portuguese)

```
Text: "Olá! Eu sou a Glass, sua raposa guia de meta-análise. 
       Estou aqui para te ajudar a entender estatística de 
       forma simples e divertida!"

Voice: Portuguese_SweetGirl
Emotion: happy
Language Boost: Portuguese
```

**Result**: A warm, friendly 8-second audio clip that immediately establishes Glass's personality.

---

## Section 4: Visual Generation Capabilities (3 minutes)

### Image Generation

The `text_to_image` tool uses MiniMax's image-01 model to create:

- **Educational diagrams**: Forest plots, funnel plots, PRISMA flowcharts
- **Mascot variations**: Glass in different poses, emotions, situations
- **Concept illustrations**: Visual metaphors for statistical concepts

### Parameters

| Parameter | Options | Default |
|-----------|---------|---------|
| Aspect Ratio | 1:1, 16:9, 4:3, 3:2, 2:3, 3:4, 9:16, 21:9 | 1:1 |
| Count | 1-9 images | 1 |
| Prompt Optimizer | true/false | true |

### Demo: Glass Mascot Generation

```
Prompt: "A cute cartoon fox mascot character, friendly and wise, 
         wearing small round glasses, orange and white fur, 
         sitting pose, simple clean background, kawaii style, 
         suitable for educational app icon"

Aspect Ratio: 1:1
```

**Result**: A professionally designed mascot image ready for use as app icon.

### Video Generation

MiniMax offers multiple video models:

| Model | Type | Best For |
|-------|------|----------|
| T2V-01 | Text-to-Video | Creating scenes from descriptions |
| T2V-01-Director | Text-to-Video + Camera Control | Cinematic tutorials |
| I2V-01 | Image-to-Video | Animating static images |
| I2V-01-Director | Image-to-Video + Camera Control | Professional animations |
| I2V-01-live | Image-to-Video (Live) | Real-time animation |
| MiniMax-Hailuo-02 | Latest Model | Ultra-clear quality, 6-10 second clips |

### Camera Movement Instructions (Director Models)

- **Truck**: left, right
- **Pan**: left, right
- **Push**: in, out
- **Pedestal**: up, down
- **Tilt**: up, down
- **Zoom**: in, out
- **Special**: shake, tracking shot, static shot

---

## Section 5: Integration Architecture (2 minutes)

### System Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Glass Agent   │────▶│  MiniMax MCP    │────▶│  MiniMax API    │
│   (Frontend)    │◀────│   Connector     │◀────│   (Cloud)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│  AgentSkills    │                           │  Generated      │
│  (13 modules)   │                           │  Media Assets   │
└─────────────────┘                           └─────────────────┘
```

### Key Integration Points

1. **Onboarding**: Glass introduces herself with voice and animation
2. **Lessons**: Voice narration for each tutorial step
3. **Quizzes**: Celebratory sounds and animations for correct answers
4. **Explanations**: On-demand visual generation for complex concepts
5. **Certificates**: Personalized completion videos

### Code Example: Generating Glass Speech

```typescript
// Using MiniMax MCP via CLI
const generateSpeech = async (text: string, language: string) => {
  const voiceMap = {
    'pt': 'Portuguese_SweetGirl',
    'en': 'English_WiseScholar',
    'es': 'Spanish_CaptivatingStoryteller'
  };
  
  const result = await mcpCall('text_to_audio', {
    text,
    voice_id: voiceMap[language],
    emotion: 'happy',
    language_boost: language
  });
  
  return result.audioUrl;
};
```

---

## Section 6: Use Cases & Applications (2 minutes)

### Current Implementations

| Feature | MiniMax Tool | Status |
|---------|-------------|--------|
| Glass voice introduction | text_to_audio | ✅ Complete |
| Mascot image generation | text_to_image | ✅ Complete |
| Animated mascot | generate_video | 🔄 In Progress |
| Lesson narration | text_to_audio | 📋 Planned |
| Concept illustrations | text_to_image | 📋 Planned |

### Future Possibilities

1. **Personalized Learning Paths**: Generate custom explanations based on student's background
2. **Interactive Simulations**: Create animated statistical concepts
3. **Multilingual Expansion**: Add voices for Hindi, Arabic, Thai, and more
4. **Voice Cloning**: Allow institutions to create custom Glass voices
5. **Music-Based Learning**: Educational songs for memorizing formulas

---

## Section 7: Cost Considerations (1 minute)

### Pricing Model

MiniMax uses a credit-based system. Key considerations:

- **Text-to-Audio**: ~$0.001 per character
- **Image Generation**: ~$0.02 per image
- **Video Generation**: ~$0.10-0.50 per video (depending on duration/quality)
- **Voice Cloning**: One-time fee per voice

### Optimization Strategies

1. **Cache frequently used audio** (greetings, common phrases)
2. **Pre-generate mascot variations** for different states
3. **Use async video generation** for non-blocking UX
4. **Batch similar requests** when possible

---

## Closing (1 minute)

### Summary

MiniMax integration transforms Glass from a simple chatbot into a **multimodal AI tutor** capable of:

- 🗣️ Speaking in 25+ languages with natural emotion
- 🎨 Creating educational illustrations on-demand
- 🎬 Generating animated explanations
- 🎵 Composing educational music

### The Vision

> "Every student deserves a patient, knowledgeable tutor who speaks their language and adapts to their learning style. Glass, powered by MiniMax, makes this vision accessible to anyone with a smartphone."

### Questions?

Thank you for your attention. I'm happy to demonstrate any specific capability or discuss integration details.

---

## Appendix: Quick Reference

### MCP Commands

```bash
# List available tools
manus-mcp-cli tool list --server minimax

# Generate speech
manus-mcp-cli tool call text_to_audio --server minimax \
  --input '{"text": "Hello!", "voice_id": "English_WiseScholar"}'

# Generate image
manus-mcp-cli tool call text_to_image --server minimax \
  --input '{"prompt": "A forest plot diagram", "aspect_ratio": "16:9"}'

# Generate video (async)
manus-mcp-cli tool call generate_video --server minimax \
  --input '{"prompt": "...", "async_mode": true}'

# Check video status
manus-mcp-cli tool call query_video_generation --server minimax \
  --input '{"task_id": "123456789"}'
```

### Voice Categories

| Category | Languages |
|----------|-----------|
| European | English, Spanish, Portuguese, French, German, Italian, Dutch, Polish, Romanian, Greek, Czech, Finnish, Ukrainian, Russian |
| Asian | Chinese (Mandarin), Japanese, Korean, Vietnamese, Thai, Indonesian, Hindi |
| Middle Eastern | Arabic, Turkish |
| Regional Chinese | Cantonese |

---

**Document Version**: 1.0  
**Last Updated**: January 7, 2026  
**Contact**: Meta Agent Team
