# Meta Agent Mobile - Curriculum de Skills

> Currículo estruturado no formato de competências (skills), similar ao modelo da Anthropic.
> Cada skill representa uma competência específica que o usuário desenvolve através do app.

---

## 📋 Visão Geral do Currículo

| Domínio | Skills | Tempo Estimado | Nível |
|---------|--------|----------------|-------|
| Fundamentos | 4 skills | 15 min | Iniciante |
| Análise Estatística | 6 skills | 25 min | Intermediário |
| Visualização | 3 skills | 10 min | Iniciante |
| Avaliação Crítica | 5 skills | 20 min | Intermediário |
| Ferramentas AI | 4 skills | 15 min | Iniciante |
| **Total** | **22 skills** | **~85 min** | - |

---

## 🎯 Domínio 1: Fundamentos de Meta-Análise

### Skill 1.1: Conceito de Meta-Análise
**ID:** `meta-analysis-concept`  
**Módulo:** Meta-Analysis Fundamentals  
**Tempo:** 3 min  
**Nível:** Iniciante

**Descrição:**  
Compreender o que é meta-análise e por que combinar estudos produz evidências mais robustas.

**Objetivos de Aprendizagem:**
- [ ] Definir meta-análise como "estudo de estudos"
- [ ] Explicar por que estudos individuais têm limitações (tamanho amostral, poder estatístico)
- [ ] Listar os benefícios da combinação de estudos (poder aumentado, generalização)

**Avaliação:**
- Quiz: "Qual é a principal vantagem da meta-análise sobre um estudo individual?"
- Resposta correta: Aumento do poder estatístico

---

### Skill 1.2: Tamanhos de Efeito (Effect Sizes)
**ID:** `effect-sizes`  
**Módulo:** Meta-Analysis Fundamentals  
**Tempo:** 5 min  
**Nível:** Iniciante

**Descrição:**  
Compreender os diferentes tipos de tamanhos de efeito e quando usar cada um.

**Objetivos de Aprendizagem:**
- [ ] Distinguir entre desfechos binários e contínuos
- [ ] Identificar quando usar Odds Ratio (OR) vs Risk Ratio (RR)
- [ ] Identificar quando usar SMD (Standardized Mean Difference) vs MD
- [ ] Interpretar a direção e magnitude de um tamanho de efeito

**Tipos de Effect Size Ensinados:**
| Tipo | Uso | Fórmula Conceitual |
|------|-----|-------------------|
| Odds Ratio (OR) | Desfechos binários | Odds tratamento / Odds controle |
| Risk Ratio (RR) | Desfechos binários | Risco tratamento / Risco controle |
| SMD (Hedges' g) | Desfechos contínuos | (M1 - M2) / SD pooled |
| Mean Difference | Desfechos contínuos (mesma escala) | M1 - M2 |

---

### Skill 1.3: Modelos de Efeitos (Fixed vs Random)
**ID:** `statistical-models`  
**Módulo:** Meta-Analysis Fundamentals  
**Tempo:** 5 min  
**Nível:** Iniciante

**Descrição:**  
Compreender a diferença entre modelos de efeito fixo e efeitos aleatórios.

**Objetivos de Aprendizagem:**
- [ ] Explicar a premissa do modelo de efeito fixo (um efeito verdadeiro)
- [ ] Explicar a premissa do modelo de efeitos aleatórios (efeitos variam)
- [ ] Identificar quando usar cada modelo
- [ ] Reconhecer o método DerSimonian-Laird

**Avaliação:**
- Quiz: "Quando você deve usar um modelo de efeitos aleatórios?"
- Resposta correta: Quando você espera que os efeitos verdadeiros variem entre estudos

---

### Skill 1.4: Navegação do App
**ID:** `app-navigation`  
**Módulo:** Welcome & App Overview  
**Tempo:** 5 min  
**Nível:** Iniciante

**Descrição:**  
Dominar a interface do terminal e os comandos básicos do Meta Agent.

**Objetivos de Aprendizagem:**
- [ ] Usar o comando /help para ver todos os comandos
- [ ] Distinguir entre comandos (/) e chat com AI
- [ ] Navegar pelo histórico de comandos
- [ ] Acessar a base de conhecimento (/knowledge)

**Comandos Ensinados:**
```
/help      - Mostrar todos os comandos
/clear     - Limpar terminal
/history   - Ver histórico
/skills    - Ver capacidades da AI
/knowledge - Navegar base de conhecimento
/r         - Executar código R
```

---

## 📊 Domínio 2: Análise Estatística

### Skill 2.1: Execução de Código R
**ID:** `r-code-execution`  
**Módulo:** Your First Forest Plot  
**Tempo:** 5 min  
**Nível:** Intermediário

**Descrição:**  
Executar código R diretamente no navegador usando WebR.

**Objetivos de Aprendizagem:**
- [ ] Usar o comando /r para executar código
- [ ] Carregar pacotes (metafor, meta)
- [ ] Carregar datasets de exemplo
- [ ] Interpretar output do R

**Exemplo de Código:**
```r
/r library(metafor)
/r data(dat.bcg)
/r res <- rma(ai=tpos, bi=tneg, ci=cpos, di=cneg, 
              data=dat.bcg, measure="OR")
```

---

### Skill 2.2: Análise de Heterogeneidade
**ID:** `heterogeneity-analysis`  
**Módulo:** Interpreting Results  
**Tempo:** 5 min  
**Nível:** Intermediário

**Descrição:**  
Avaliar e interpretar a heterogeneidade entre estudos.

**Objetivos de Aprendizagem:**
- [ ] Interpretar a estatística I² (0-25% baixa, 25-50% moderada, 50-75% substancial, >75% considerável)
- [ ] Interpretar o teste Q de Cochran
- [ ] Identificar fontes potenciais de heterogeneidade
- [ ] Decidir se análise de subgrupos é apropriada

**Métricas Ensinadas:**
| Métrica | Interpretação |
|---------|---------------|
| I² | % da variabilidade devido a heterogeneidade |
| Q | Teste estatístico de heterogeneidade |
| τ² (tau²) | Variância entre estudos |

---

### Skill 2.3: Detecção de Viés de Publicação
**ID:** `publication-bias`  
**Módulo:** Interpreting Results  
**Tempo:** 5 min  
**Nível:** Intermediário

**Descrição:**  
Identificar e avaliar viés de publicação usando métodos visuais e estatísticos.

**Objetivos de Aprendizagem:**
- [ ] Criar e interpretar funnel plots
- [ ] Identificar assimetria visual
- [ ] Compreender o teste de Egger
- [ ] Conhecer o método trim-and-fill

**Código Ensinado:**
```r
/r funnel(res)
/r regtest(res)  # Egger's test
```

---

### Skill 2.4: Entrada de Dados
**ID:** `data-entry`  
**Módulo:** Working with Study Data  
**Tempo:** 4 min  
**Nível:** Intermediário

**Descrição:**  
Preparar e importar dados para meta-análise.

**Objetivos de Aprendizagem:**
- [ ] Identificar dados necessários para desfechos binários (eventos, totais)
- [ ] Identificar dados necessários para desfechos contínuos (média, DP, N)
- [ ] Importar dados via CSV
- [ ] Criar dados diretamente em R

**Formato de Dados Ensinado:**
```
Binário: study, events_treat, n_treat, events_ctrl, n_ctrl
Contínuo: study, mean_treat, sd_treat, n_treat, mean_ctrl, sd_ctrl, n_ctrl
```

---

### Skill 2.5: Extração de Dados
**ID:** `data-extraction`  
**Módulo:** Working with Study Data  
**Tempo:** 3 min  
**Nível:** Intermediário

**Descrição:**  
Aplicar boas práticas de extração de dados de estudos primários.

**Objetivos de Aprendizagem:**
- [ ] Usar formulários padronizados de extração
- [ ] Implementar extração dupla independente
- [ ] Resolver discrepâncias por consenso
- [ ] Documentar todas as decisões

---

### Skill 2.6: Avaliação GRADE
**ID:** `grade-assessment`  
**Módulo:** Interpreting Results  
**Tempo:** 3 min  
**Nível:** Intermediário

**Descrição:**  
Avaliar a qualidade da evidência usando o framework GRADE.

**Objetivos de Aprendizagem:**
- [ ] Listar fatores que diminuem qualidade (risco de viés, inconsistência, imprecisão, etc.)
- [ ] Listar fatores que aumentam qualidade (grande efeito, dose-resposta)
- [ ] Classificar evidência (alta, moderada, baixa, muito baixa)

**Framework GRADE:**
| Fator | Direção |
|-------|---------|
| Risco de viés | ↓ Diminui |
| Inconsistência | ↓ Diminui |
| Imprecisão | ↓ Diminui |
| Viés de publicação | ↓ Diminui |
| Grande efeito | ↑ Aumenta |
| Dose-resposta | ↑ Aumenta |

---

## 🌲 Domínio 3: Visualização

### Skill 3.1: Criação de Forest Plots
**ID:** `forest-plot-creation`  
**Módulo:** Your First Forest Plot  
**Tempo:** 5 min  
**Nível:** Iniciante

**Descrição:**  
Criar forest plots usando o pacote metafor.

**Objetivos de Aprendizagem:**
- [ ] Executar função forest() no metafor
- [ ] Personalizar aparência do plot
- [ ] Exportar visualizações

**Código Ensinado:**
```r
/r res <- rma(ai=tpos, bi=tneg, ci=cpos, di=cneg, 
              data=dat.bcg, measure="OR")
/r forest(res)
```

---

### Skill 3.2: Interpretação de Forest Plots
**ID:** `forest-plot-interpretation`  
**Módulo:** Your First Forest Plot  
**Tempo:** 3 min  
**Nível:** Iniciante

**Descrição:**  
Ler e interpretar todos os elementos de um forest plot.

**Objetivos de Aprendizagem:**
- [ ] Identificar estimativas pontuais (quadrados)
- [ ] Interpretar intervalos de confiança (linhas horizontais)
- [ ] Compreender pesos dos estudos (tamanho dos quadrados)
- [ ] Interpretar efeito combinado (diamante)
- [ ] Identificar linha de nulo efeito

**Elementos do Forest Plot:**
```
┌─────────────────────────────────────────┐
│ Estudo      │ ■──────│ OR [95% CI]     │
│ Smith 2020  │   ■────│ 0.65 [0.45,0.94]│
│ Jones 2021  │    ■───│ 0.72 [0.58,0.89]│
│ Lee 2022    │  ■─────│ 0.58 [0.38,0.88]│
│ Pooled      │   ◆    │ 0.65 [0.54,0.78]│
│             │   │    │                  │
│             │   1    │ (linha de nulo)  │
└─────────────────────────────────────────┘
```

---

### Skill 3.3: Criação de Funnel Plots
**ID:** `funnel-plot-creation`  
**Módulo:** Interpreting Results  
**Tempo:** 2 min  
**Nível:** Iniciante

**Descrição:**  
Criar funnel plots para avaliar viés de publicação.

**Objetivos de Aprendizagem:**
- [ ] Executar função funnel()
- [ ] Interpretar simetria/assimetria
- [ ] Identificar estudos outliers

---

## 🔍 Domínio 4: Avaliação Crítica

### Skill 4.1: Significância Estatística vs Clínica
**ID:** `statistical-vs-clinical-significance`  
**Módulo:** Interpreting Results  
**Tempo:** 3 min  
**Nível:** Intermediário

**Descrição:**  
Distinguir entre significância estatística e relevância clínica.

**Objetivos de Aprendizagem:**
- [ ] Definir significância estatística (p < 0.05)
- [ ] Definir significância clínica (efeito clinicamente relevante)
- [ ] Reconhecer que p-valor não indica magnitude do efeito
- [ ] Usar intervalos de confiança para avaliar precisão

---

### Skill 4.2: Avaliação de Risco de Viés
**ID:** `risk-of-bias`  
**Módulo:** (Implícito no conteúdo)  
**Tempo:** 5 min  
**Nível:** Intermediário

**Descrição:**  
Avaliar risco de viés em estudos individuais.

**Ferramentas Mencionadas:**
- RoB 2 (ensaios randomizados)
- ROBINS-I (estudos não-randomizados)
- Newcastle-Ottawa Scale (estudos observacionais)

---

### Skill 4.3: Análise de Sensibilidade
**ID:** `sensitivity-analysis`  
**Módulo:** (Implícito no conteúdo)  
**Tempo:** 3 min  
**Nível:** Intermediário

**Descrição:**  
Testar robustez dos resultados através de análises de sensibilidade.

**Tipos de Análise:**
- Leave-one-out (remover um estudo por vez)
- Análise por qualidade do estudo
- Análise por modelo (fixo vs aleatório)

---

### Skill 4.4: Análise de Subgrupos
**ID:** `subgroup-analysis`  
**Módulo:** (Implícito no conteúdo)  
**Tempo:** 4 min  
**Nível:** Intermediário

**Descrição:**  
Explorar heterogeneidade através de análises de subgrupos.

**Objetivos de Aprendizagem:**
- [ ] Identificar variáveis moderadoras potenciais
- [ ] Executar análise de subgrupos em R
- [ ] Interpretar diferenças entre subgrupos
- [ ] Evitar data dredging (pré-especificar subgrupos)

---

### Skill 4.5: Padrões de Reporte (PRISMA)
**ID:** `prisma-reporting`  
**Módulo:** Using AI Assistant  
**Tempo:** 2 min  
**Nível:** Intermediário

**Descrição:**  
Conhecer os padrões PRISMA 2020 para reporte de revisões sistemáticas.

**Elementos PRISMA:**
- Fluxograma de seleção de estudos
- Checklist de itens obrigatórios
- Registro de protocolo (PROSPERO)

---

## 🤖 Domínio 5: Ferramentas de AI

### Skill 5.1: Método Socrático
**ID:** `socratic-method`  
**Módulo:** Using AI Assistant  
**Tempo:** 5 min  
**Nível:** Iniciante

**Descrição:**  
Usar o método socrático da AI para aprendizado profundo.

**Objetivos de Aprendizagem:**
- [ ] Compreender que a AI faz perguntas guiadas
- [ ] Engajar em diálogo bidirecional
- [ ] Construir entendimento passo a passo
- [ ] Conectar conceitos entre si

---

### Skill 5.2: Base de Conhecimento
**ID:** `knowledge-base`  
**Módulo:** Using AI Assistant  
**Tempo:** 3 min  
**Nível:** Iniciante

**Descrição:**  
Navegar e usar a base de conhecimento do Meta Agent.

**Fontes Incluídas:**
- Cochrane Handbook
- Artigos seminais (DerSimonian-Laird, Higgins I²)
- Guidelines GRADE
- PRISMA 2020

---

### Skill 5.3: Geração de Código R
**ID:** `r-code-generation`  
**Módulo:** Using AI Assistant  
**Tempo:** 4 min  
**Nível:** Iniciante

**Descrição:**  
Usar a AI para gerar e debugar código R.

**Capacidades:**
- Gerar código metafor/meta
- Explicar código linha por linha
- Debugar erros
- Sugerir melhorias

---

### Skill 5.4: Interação Efetiva com AI
**ID:** `effective-ai-interaction`  
**Módulo:** Using AI Assistant  
**Tempo:** 3 min  
**Nível:** Iniciante

**Descrição:**  
Maximizar a utilidade da AI através de prompts efetivos.

**Boas Práticas:**
- [ ] Ser específico ("Ajude-me a interpretar I² de 75%" vs "explique heterogeneidade")
- [ ] Compartilhar contexto (descrever questão de pesquisa)
- [ ] Perguntar "por quê" (AI explica raciocínio)
- [ ] Pedir exemplos concretos
- [ ] Desafiar respostas (diálogo socrático)

---

## 📚 Datasets de Prática Incluídos

| Dataset | Estudos | Área | Effect Size | Uso Pedagógico |
|---------|---------|------|-------------|----------------|
| BCG Vaccine Trials | 13 | Medicina | RR | Heterogeneidade, moderadores |
| Aspirin CVD Prevention | 9 | Medicina | OR | Análise básica |
| CBT for Depression | 12 | Psicologia | SMD | Desfechos contínuos |
| Homework Effect | 10 | Educação | SMD | Subgrupos por série |

---

## 🏆 Sistema de Badges

| Badge | Skill Relacionada | Critério |
|-------|-------------------|----------|
| 🚀 First Steps | app-navigation | Completar módulo Welcome |
| 🎓 Theory Master | meta-analysis-concept | Completar módulo Fundamentals |
| 🌲 Forest Ranger | forest-plot-creation | Criar primeiro forest plot |
| 📋 Data Wrangler | data-entry | Completar módulo Data Entry |
| 🔍 Critical Thinker | heterogeneity-analysis | Completar módulo Interpreting |
| 🤖 AI Whisperer | socratic-method | Completar módulo AI Assistant |

---

## 🎯 Mapeamento: Módulos → Skills

```
Module: Welcome & App Overview
├── Skill 1.4: app-navigation

Module: Meta-Analysis Fundamentals  
├── Skill 1.1: meta-analysis-concept
├── Skill 1.2: effect-sizes
└── Skill 1.3: statistical-models

Module: Your First Forest Plot
├── Skill 2.1: r-code-execution
├── Skill 3.1: forest-plot-creation
└── Skill 3.2: forest-plot-interpretation

Module: Working with Study Data
├── Skill 2.4: data-entry
└── Skill 2.5: data-extraction

Module: Interpreting Results
├── Skill 2.2: heterogeneity-analysis
├── Skill 2.3: publication-bias
├── Skill 2.6: grade-assessment
├── Skill 3.3: funnel-plot-creation
└── Skill 4.1: statistical-vs-clinical-significance

Module: Using AI Assistant
├── Skill 5.1: socratic-method
├── Skill 5.2: knowledge-base
├── Skill 5.3: r-code-generation
└── Skill 5.4: effective-ai-interaction
```

---

## 📈 Progressão Sugerida

```
Semana 1: Fundamentos
├── Day 1: Welcome + Meta-Analysis Concept
├── Day 2: Effect Sizes
└── Day 3: Statistical Models

Semana 2: Prática
├── Day 4: Forest Plot Creation
├── Day 5: Data Entry
└── Day 6: R Code Execution

Semana 3: Análise Crítica
├── Day 7: Heterogeneity Analysis
├── Day 8: Publication Bias
└── Day 9: GRADE Assessment

Semana 4: Domínio
├── Day 10: AI Assistant Skills
└── Day 11-14: Prática com datasets reais
```

---

## 🔄 Skills Futuras (Roadmap)

### Planejadas
- [ ] Meta-regressão
- [ ] Network meta-analysis
- [ ] IPD meta-analysis (dados individuais)
- [ ] Bayesian meta-analysis
- [ ] Living systematic reviews

### Em Consideração
- [ ] Diagnostic test accuracy meta-analysis
- [ ] Dose-response meta-analysis
- [ ] Multivariate meta-analysis

---

*Documento gerado em: Janeiro 2026*  
*Versão do Currículo: 1.0*
