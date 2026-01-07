# Glass Integration Plan

## Overview

**Glass** 🦊 é nossa raposa guia, nomeada em homenagem a Gene Glass (criador do termo "meta-análise").

## Mini-Agent (MiniMax) Integration

O Mini-Agent da MiniMax é perfeito para ser a base da Glass porque:

### Features Relevantes

1. **Claude Skills Integration** - Já suporta 15 skills profissionais, compatível com nossas AgentSkills
2. **Persistent Memory** - Session Note Tool para reter informações entre sessões
3. **Intelligent Context Management** - Sumariza histórico automaticamente
4. **MCP Tool Integration** - Suporte nativo a ferramentas MCP
5. **Anthropic-compatible API** - Funciona com modelos compatíveis

### Arquitetura Proposta

```
┌─────────────────────────────────────────────────────┐
│                    Glass 🦊                          │
│         (Raposa guia multilíngue)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   MiniMax   │  │   Mistral   │  │  On-Device  │ │
│  │    M2.1     │  │   (Cloud)   │  │   (Local)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │                │                │        │
│         └────────────────┼────────────────┘        │
│                          │                         │
│              ┌───────────┴───────────┐             │
│              │    Mini-Agent Core    │             │
│              │  (Execution Pipeline) │             │
│              └───────────┬───────────┘             │
│                          │                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ AgentSkills │  │   Memory    │  │    MCP      │ │
│  │ (Meta-Anál) │  │  (Shared)   │  │   Tools     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Multilíngue

Glass detecta automaticamente e se adapta:
- 🇧🇷 Português (BR) - Padrão para usuários brasileiros
- 🇺🇸 English - Default for international users
- 🇪🇸 Español - Para América Latina
- 🇨🇳 中文 - Suporte futuro

### Personalidade da Glass

- **Nome**: Glass (homenagem a Gene Glass)
- **Mascote**: Raposa 🦊
- **Inspiração**: Zenko (善狐) - raposa do bem na mitologia japonesa
- **Tom**: Acolhedor, paciente, usa método socrático
- **Características**:
  - Curiosa (faz perguntas guiadas)
  - Adaptável (ajusta ao nível do aluno)
  - Encorajadora (celebra progresso)
  - Multilíngue (detecta idioma automaticamente)

### Integração com App Mobile

1. **Onboarding** - Glass se apresenta e conhece o aluno
2. **Tutorial** - Glass guia pelos módulos de aprendizagem
3. **Terminal** - Glass responde perguntas sobre meta-análise
4. **Skills** - Glass usa as AgentSkills que criamos
5. **Memory** - Glass lembra do progresso e preferências

### Próximos Passos

1. [ ] Criar ASCII art da raposa Glass
2. [ ] Implementar detecção de idioma
3. [ ] Integrar Mini-Agent como backend
4. [ ] Adicionar alternância com Mistral on-device
5. [ ] Implementar shared memory entre agentes
6. [ ] Criar frases e personalidade em múltiplos idiomas

## Referências

- Mini-Agent: https://github.com/MiniMax-AI/Mini-Agent
- AgentSkills: https://github.com/agentskills/agentskills
- MiniMax M2.1: https://platform.minimax.io
