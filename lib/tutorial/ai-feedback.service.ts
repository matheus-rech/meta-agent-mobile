/**
 * AI Feedback Service
 * 
 * Provides personalized AI-powered feedback during tutorials using MiniMax.
 */

import { miniAgentService, MiniAgentResponse } from '../glass/mini-agent.service';

export interface FeedbackContext {
  tutorialId: string;
  stepId: string;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
  attemptNumber?: number;
  previousMistakes?: string[];
}

export interface PersonalizedFeedback {
  message: string;
  encouragement: string;
  tip?: string;
  nextStepHint?: string;
  glassEmotion: 'happy' | 'encouraging' | 'thinking' | 'celebrating';
  suggestedResources?: string[];
}

// Feedback templates for different scenarios
const FEEDBACK_TEMPLATES = {
  correct: {
    first_try: [
      "🎉 Perfeito! Você acertou de primeira! Isso mostra que você está entendendo bem o conceito.",
      "✨ Excelente! Resposta correta na primeira tentativa! Você está dominando isso!",
      "🦊 Maravilha! Acertou logo de cara! Continue assim!",
    ],
    second_try: [
      "👍 Muito bem! Você conseguiu! Às vezes precisamos de uma segunda chance para acertar.",
      "🎯 Ótimo! Você aprendeu com o erro anterior e acertou agora!",
      "🦊 Isso aí! Persistência é a chave do aprendizado!",
    ],
    after_struggle: [
      "💪 Parabéns por não desistir! Você finalmente conseguiu!",
      "🌟 Sua persistência valeu a pena! Agora você realmente entende o conceito.",
      "🦊 Que orgulho! Você lutou e venceu!",
    ],
  },
  incorrect: {
    first_attempt: [
      "Não se preocupe! Vamos tentar de novo. Pense sobre {hint}.",
      "Hmm, não foi dessa vez. Que tal revisarmos o conceito de {concept}?",
      "🦊 Calma, errar faz parte do aprendizado! Vamos analisar juntos.",
    ],
    repeated: [
      "Vejo que esse conceito está difícil. Vamos revisar passo a passo?",
      "Não desanime! Alguns conceitos precisam de mais tempo. Vamos com calma.",
      "🦊 Esse é um conceito desafiador mesmo. Vou te explicar de outro jeito.",
    ],
  },
  encouragement: {
    slow_progress: [
      "Cada pessoa tem seu ritmo. O importante é continuar aprendendo!",
      "Lembre-se: meta-análise é complexa. Você está indo muito bem!",
      "🦊 Não se compare com outros. Seu progresso é o que importa!",
    ],
    fast_progress: [
      "Uau, você está voando! Mas não se esqueça de revisar os conceitos.",
      "Impressionante velocidade! Quer tentar um desafio extra?",
      "🦊 Você está arrasando! Pronto para o próximo nível?",
    ],
    returning_user: [
      "Que bom te ver de volta! Vamos continuar de onde paramos?",
      "Bem-vindo de volta! Sua dedicação é admirável!",
      "🦊 Olá novamente! Pronto para mais uma sessão de aprendizado?",
    ],
  },
};

class AIFeedbackService {
  /**
   * Generate personalized feedback based on user performance
   */
  async generateFeedback(context: FeedbackContext): Promise<PersonalizedFeedback> {
    const { isCorrect, attemptNumber = 1, timeSpent = 0 } = context;
    
    // Determine feedback category
    let feedbackCategory: keyof typeof FEEDBACK_TEMPLATES;
    let subcategory: string;
    
    if (isCorrect) {
      feedbackCategory = 'correct';
      if (attemptNumber === 1) {
        subcategory = 'first_try';
      } else if (attemptNumber === 2) {
        subcategory = 'second_try';
      } else {
        subcategory = 'after_struggle';
      }
    } else {
      feedbackCategory = 'incorrect';
      subcategory = attemptNumber === 1 ? 'first_attempt' : 'repeated';
    }
    
    // Get template messages
    const templates = FEEDBACK_TEMPLATES[feedbackCategory] as Record<string, string[]>;
    const messages = templates[subcategory] || templates[Object.keys(templates)[0]];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Determine emotion
    let glassEmotion: PersonalizedFeedback['glassEmotion'];
    if (isCorrect && attemptNumber === 1) {
      glassEmotion = 'celebrating';
    } else if (isCorrect) {
      glassEmotion = 'happy';
    } else if (attemptNumber > 2) {
      glassEmotion = 'encouraging';
    } else {
      glassEmotion = 'thinking';
    }
    
    // Generate encouragement
    const encouragementCategory = timeSpent < 5000 ? 'fast_progress' : 'slow_progress';
    const encouragements = FEEDBACK_TEMPLATES.encouragement[encouragementCategory];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    // Generate tip if incorrect
    let tip: string | undefined;
    if (!isCorrect) {
      tip = await this.generateContextualTip(context);
    }
    
    return {
      message,
      encouragement,
      tip,
      glassEmotion,
    };
  }
  
  /**
   * Generate a contextual tip using AI
   */
  private async generateContextualTip(context: FeedbackContext): Promise<string> {
    const { tutorialId, stepId, userAnswer, correctAnswer } = context;
    
    // Map tutorial IDs to concepts
    const conceptMap: Record<string, string> = {
      'forest-plot': 'forest plots and effect size visualization',
      'heterogeneity': 'heterogeneity measures like I² and Q statistics',
      'subgroup': 'subgroup analysis and moderator variables',
      'meta-regression': 'meta-regression and continuous moderators',
    };
    
    const concept = conceptMap[tutorialId] || 'meta-analysis';
    
    // Generate tip based on context
    const tips: string[] = [
      `Lembre-se: em ${concept}, o ponto central representa o efeito estimado.`,
      `Dica: revise o conceito de intervalo de confiança em ${concept}.`,
      `Tente pensar no que cada elemento do gráfico representa.`,
      `Volte ao passo anterior e releia a explicação sobre ${concept}.`,
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
  
  /**
   * Generate AI-powered explanation for a concept
   */
  async explainConcept(concept: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<string> {
    try {
      const prompt = `Explain the concept of "${concept}" in meta-analysis for a ${userLevel} level student. 
      Keep it concise (2-3 sentences) and use simple language.
      If possible, give a practical example.`;
      
      const response = await miniAgentService.chat(prompt);
      return response.content;
    } catch (error) {
      console.error('[AIFeedback] Failed to explain concept:', error);
      return `${concept} é um conceito importante em meta-análise. Consulte o Cochrane Handbook para mais detalhes.`;
    }
  }
  
  /**
   * Generate personalized study recommendations
   */
  async getStudyRecommendations(
    completedTutorials: string[],
    quizScores: Record<string, number>,
    weakAreas: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Recommend based on weak areas
    for (const area of weakAreas) {
      if (area === 'heterogeneity' && !completedTutorials.includes('heterogeneity')) {
        recommendations.push('Complete o tutorial de Heterogeneidade para fortalecer esse conceito.');
      }
      if (area === 'effect-size' && quizScores['forest-plot'] < 70) {
        recommendations.push('Revise o tutorial de Forest Plot, focando na interpretação de effect sizes.');
      }
    }
    
    // Recommend next tutorial
    if (!completedTutorials.includes('forest-plot')) {
      recommendations.push('Comece pelo tutorial de Forest Plot - é a base de tudo!');
    } else if (!completedTutorials.includes('heterogeneity')) {
      recommendations.push('Próximo passo: tutorial de Heterogeneidade.');
    } else if (!completedTutorials.includes('subgroup')) {
      recommendations.push('Você está pronto para o tutorial de Análise de Subgrupos!');
    } else if (!completedTutorials.includes('meta-regression')) {
      recommendations.push('Desafio avançado: tutorial de Meta-Regressão.');
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue praticando com os quizzes de repetição espaçada.');
      recommendations.push('Tente aplicar os conceitos em um artigo real de meta-análise.');
    }
    
    return recommendations;
  }
  
  /**
   * Generate motivational message based on user activity
   */
  getMotivationalMessage(
    streak: number,
    lastActiveDate: Date | null,
    totalQuizzes: number
  ): string {
    const now = new Date();
    const daysSinceActive = lastActiveDate 
      ? Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysSinceActive > 7) {
      return '🦊 Sentimos sua falta! Que tal retomar os estudos hoje?';
    }
    
    if (streak >= 7) {
      return `🔥 Incrível! ${streak} dias de streak! Você é uma inspiração!`;
    }
    
    if (streak >= 3) {
      return `🦊 ${streak} dias seguidos! Continue assim e você vai longe!`;
    }
    
    if (totalQuizzes === 0) {
      return '🦊 Pronto para começar sua jornada em meta-análise?';
    }
    
    if (totalQuizzes < 5) {
      return '🦊 Você está nos primeiros passos. Cada quiz conta!';
    }
    
    return '🦊 Bem-vindo de volta! Vamos aprender algo novo hoje?';
  }
}

// Export singleton
export const aiFeedbackService = new AIFeedbackService();

// Export convenience functions
export const generateFeedback = (context: FeedbackContext) => 
  aiFeedbackService.generateFeedback(context);
export const explainConcept = (concept: string, level: 'beginner' | 'intermediate' | 'advanced') => 
  aiFeedbackService.explainConcept(concept, level);
export const getStudyRecommendations = (
  completed: string[], 
  scores: Record<string, number>, 
  weak: string[]
) => aiFeedbackService.getStudyRecommendations(completed, scores, weak);
export const getMotivationalMessage = (streak: number, lastActive: Date | null, total: number) => 
  aiFeedbackService.getMotivationalMessage(streak, lastActive, total);
