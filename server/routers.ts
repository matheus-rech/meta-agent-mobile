import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// Agent system prompt
const AGENT_SYSTEM_PROMPT = `You are Meta Agent, an AI-powered assistant running in a mobile CLI terminal.

## Capabilities
- Answer questions and provide information
- Help with research and analysis
- Assist with writing and editing
- Explain code and technical concepts
- Perform calculations and data analysis
- Generate creative content

## Response Style
- Be concise but thorough
- Use markdown formatting when helpful
- For code, use fenced code blocks with language tags
- Break complex answers into clear sections
- Be direct and avoid unnecessary pleasantries

## Constraints
- You cannot access the internet or external APIs directly
- You cannot execute code or run commands on the user's device
- You cannot access files on the user's device
- Be honest about your limitations

When the user asks for help, provide clear, actionable guidance.`;

// Message schema for chat
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Agent chat endpoint
  agent: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1).max(10000),
          history: z.array(messageSchema).max(50).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { message, history = [] } = input;

        // Build messages array for LLM
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: AGENT_SYSTEM_PROMPT },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: message },
        ];

        try {
          const response = await invokeLLM({ messages });

          const rawAssistantMessage = response.choices?.[0]?.message?.content;

          if (!rawAssistantMessage) {
            throw new Error("No response from AI");
          }

          const assistantMessage = typeof rawAssistantMessage === 'string' 
            ? rawAssistantMessage 
            : JSON.stringify(rawAssistantMessage);

          return {
            success: true as const,
            response: assistantMessage,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error("Agent chat error:", error);
          return {
            success: false as const,
            response: "I encountered an error processing your request. Please try again.",
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),

    // Plan decomposition endpoint
    plan: publicProcedure
      .input(
        z.object({
          task: z.string().min(1).max(5000),
        })
      )
      .mutation(async ({ input }) => {
        const { task } = input;

        const planningPrompt = `You are a task planning assistant. Break down the following task into clear, actionable steps.

Task: ${task}

Respond with a JSON object containing:
{
  "goal": "Clear statement of the goal",
  "steps": [
    {
      "id": 1,
      "action": "What to do",
      "description": "Detailed explanation"
    }
  ],
  "estimatedTime": "Time estimate"
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a task planning assistant. Always respond with valid JSON." },
              { role: "user", content: planningPrompt },
            ],
            response_format: { type: "json_object" },
          });

          const rawContent = response.choices?.[0]?.message?.content;
          
          if (!rawContent) {
            throw new Error("No response from AI");
          }

          const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
          const plan = JSON.parse(content);

          return {
            success: true,
            plan,
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error("Agent plan error:", error);
          return {
            success: false,
            plan: null,
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),

    // Health check
    health: publicProcedure.query(() => ({
      status: "ok",
      timestamp: Date.now(),
      version: "1.0.0",
    })),
  }),
});

export type AppRouter = typeof appRouter;
