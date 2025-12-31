import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { executeR, checkREnvironment, generateForestPlot, generateFunnelPlot, runMetaAnalysis, R_TEMPLATES } from "./r-execute";
import { executeRWithStreaming, StreamEvent } from "./r-streaming";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// Agent system prompt with R capabilities
const AGENT_SYSTEM_PROMPT = `You are Meta Agent, an AI-powered research assistant running in a mobile CLI terminal.

## Core Capabilities
- Answer questions and provide information
- Help with research and analysis
- Assist with writing and editing
- Explain code and technical concepts
- Perform calculations and data analysis
- Generate creative content

## R/Statistical Analysis Capabilities
- Execute R code for statistical analysis
- Run meta-analyses (binary, continuous, proportion outcomes)
- Generate forest plots and funnel plots
- Perform risk of bias assessments
- Create PRISMA flow diagrams

## Response Style
- Be concise but thorough
- Use markdown formatting when helpful
- For code, use fenced code blocks with language tags
- Break complex answers into clear sections
- Be direct and avoid unnecessary pleasantries
- When showing R code, explain what it does

## For Meta-Analysis Requests
When the user wants to run a meta-analysis:
1. Ask for the data format (CSV with columns for study, events, sample sizes)
2. Determine the outcome type (binary, continuous, or proportion)
3. Suggest appropriate effect measures (OR, RR, MD, SMD)
4. Generate forest and funnel plots
5. Interpret the results

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

  // R execution endpoints
  r: router({
    // Check R environment status
    status: publicProcedure.query(async () => {
      const env = await checkREnvironment();
      return {
        ...env,
        timestamp: Date.now(),
      };
    }),

    // Execute arbitrary R code
    execute: publicProcedure
      .input(
        z.object({
          code: z.string().min(1).max(50000),
          timeout: z.number().min(1000).max(300000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { code, timeout } = input;
        
        try {
          const result = await executeR({ code, timeout });
          
          // Read file contents for small files (images as base64)
          const fileContents: Record<string, string> = {};
          for (const file of result.files) {
            const ext = path.extname(file).toLowerCase();
            if ([".png", ".jpg", ".jpeg", ".gif", ".svg"].includes(ext)) {
              const data = await fs.readFile(file);
              fileContents[path.basename(file)] = `data:image/${ext.slice(1)};base64,${data.toString("base64")}`;
            } else if ([".txt", ".json", ".csv"].includes(ext)) {
              const data = await fs.readFile(file, "utf-8");
              if (data.length < 100000) {
                fileContents[path.basename(file)] = data;
              }
            }
          }
          
          return {
            success: result.success,
            output: result.output,
            error: result.error,
            files: result.files.map(f => path.basename(f)),
            fileContents,
            executionTime: result.executionTime,
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Unknown error",
            files: [],
            fileContents: {},
            executionTime: 0,
            timestamp: Date.now(),
          };
        }
      }),

    // Run meta-analysis
    metaAnalysis: publicProcedure
      .input(
        z.object({
          type: z.enum(["binary", "continuous", "proportion"]),
          data: z.string(), // CSV data as string
          measure: z.enum(["OR", "RR", "RD", "MD", "SMD"]).optional(),
          columns: z.object({
            study: z.string().default("study"),
            year: z.string().optional(),
            events_int: z.string().optional(),
            n_int: z.string().optional(),
            events_ctrl: z.string().optional(),
            n_ctrl: z.string().optional(),
            mean_int: z.string().optional(),
            sd_int: z.string().optional(),
            mean_ctrl: z.string().optional(),
            sd_ctrl: z.string().optional(),
            events: z.string().optional(),
            total: z.string().optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { type, data, measure = "OR", columns } = input;
        const cols = (columns || {}) as Record<string, string | undefined>;
        
        // Create temp directory
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "meta-analysis-"));
        const inputFile = path.join(workDir, "data.csv");
        const outputDir = path.join(workDir, "output");
        
        try {
          // Write CSV data to file
          await fs.writeFile(inputFile, data, "utf-8");
          await fs.mkdir(outputDir, { recursive: true });
          
          // Determine template and params
          const templateKey = type === "binary" ? "meta_binary" : 
                             type === "continuous" ? "meta_continuous" : "meta_binary";
          
          const params: Record<string, string | number> = {
            MEASURE: measure,
            STUDY: cols.study || "study",
            YEAR: cols.year || "year",
          };
          
          if (type === "binary") {
            params.EVENTS_INT = cols.events_int || "events_int";
            params.N_INT = cols.n_int || "n_int";
            params.EVENTS_CTRL = cols.events_ctrl || "events_ctrl";
            params.N_CTRL = cols.n_ctrl || "n_ctrl";
          } else if (type === "continuous") {
            params.N_INT = cols.n_int || "n_int";
            params.MEAN_INT = cols.mean_int || "mean_int";
            params.SD_INT = cols.sd_int || "sd_int";
            params.N_CTRL = cols.n_ctrl || "n_ctrl";
            params.MEAN_CTRL = cols.mean_ctrl || "mean_ctrl";
            params.SD_CTRL = cols.sd_ctrl || "sd_ctrl";
          }
          
          const result = await runMetaAnalysis({
            template: templateKey,
            inputFile,
            outputDir,
            params,
          });
          
          // Read generated files
          const fileContents: Record<string, string> = {};
          for (const file of result.files) {
            const ext = path.extname(file).toLowerCase();
            if ([".png", ".jpg", ".jpeg"].includes(ext)) {
              const fileData = await fs.readFile(file);
              fileContents[path.basename(file)] = `data:image/${ext.slice(1)};base64,${fileData.toString("base64")}`;
            } else if ([".txt", ".json"].includes(ext)) {
              const fileData = await fs.readFile(file, "utf-8");
              fileContents[path.basename(file)] = fileData;
            }
          }
          
          // Also check output directory
          try {
            const outputFiles = await fs.readdir(outputDir);
            for (const fileName of outputFiles) {
              const filePath = path.join(outputDir, fileName);
              const ext = path.extname(fileName).toLowerCase();
              if ([".png", ".jpg", ".jpeg"].includes(ext)) {
                const fileData = await fs.readFile(filePath);
                fileContents[fileName] = `data:image/${ext.slice(1)};base64,${fileData.toString("base64")}`;
              } else if ([".txt", ".json"].includes(ext)) {
                const fileData = await fs.readFile(filePath, "utf-8");
                fileContents[fileName] = fileData;
              }
            }
          } catch {
            // Output directory might not exist
          }
          
          return {
            success: result.success,
            output: result.output,
            error: result.error,
            files: Object.keys(fileContents),
            fileContents,
            executionTime: result.executionTime,
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Unknown error",
            files: [],
            fileContents: {},
            executionTime: 0,
            timestamp: Date.now(),
          };
        }
      }),

    // Generate forest plot
    forestPlot: publicProcedure
      .input(
        z.object({
          data: z.string(), // CSV data
          width: z.number().min(400).max(2400).optional(),
          height: z.number().min(300).max(1600).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { data, width = 1200, height = 800 } = input;
        
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "forest-plot-"));
        const inputFile = path.join(workDir, "data.csv");
        const outputFile = path.join(workDir, "forest_plot.png");
        
        try {
          await fs.writeFile(inputFile, data, "utf-8");
          
          const result = await generateForestPlot({
            inputFile,
            outputFile,
            width,
            height,
          });
          
          let imageData = "";
          if (result.success) {
            const fileData = await fs.readFile(outputFile);
            imageData = `data:image/png;base64,${fileData.toString("base64")}`;
          }
          
          return {
            success: result.success,
            output: result.output,
            error: result.error,
            image: imageData,
            executionTime: result.executionTime,
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Unknown error",
            image: "",
            executionTime: 0,
            timestamp: Date.now(),
          };
        }
      }),

    // Generate funnel plot
    funnelPlot: publicProcedure
      .input(
        z.object({
          data: z.string(), // CSV data
        })
      )
      .mutation(async ({ input }) => {
        const { data } = input;
        
        const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "funnel-plot-"));
        const inputFile = path.join(workDir, "data.csv");
        const outputFile = path.join(workDir, "funnel_plot.png");
        
        try {
          await fs.writeFile(inputFile, data, "utf-8");
          
          const result = await generateFunnelPlot({
            inputFile,
            outputFile,
          });
          
          let imageData = "";
          let eggerTest = "";
          
          if (result.success) {
            const fileData = await fs.readFile(outputFile);
            imageData = `data:image/png;base64,${fileData.toString("base64")}`;
            
            // Try to read Egger's test results
            try {
              eggerTest = await fs.readFile(`${outputFile}.egger.txt`, "utf-8");
            } catch {
              // Egger test file might not exist
            }
          }
          
          return {
            success: result.success,
            output: result.output,
            error: result.error,
            image: imageData,
            eggerTest,
            executionTime: result.executionTime,
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Unknown error",
            image: "",
            eggerTest: "",
            executionTime: 0,
            timestamp: Date.now(),
          };
        }
      }),

    // Get available R templates
    templates: publicProcedure.query(() => ({
      templates: Object.keys(R_TEMPLATES),
      timestamp: Date.now(),
    })),

    // Execute R code with streaming output (returns all events at once)
    executeStreaming: publicProcedure
      .input(
        z.object({
          code: z.string().min(1).max(50000),
          timeout: z.number().min(1000).max(300000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { code, timeout = 120000 } = input;
        
        try {
          const result = await executeRWithStreaming({ code, timeout });
          
          // Read file contents for generated files
          const fileContents: Record<string, string> = {};
          for (const file of result.files) {
            const ext = path.extname(file).toLowerCase();
            if ([".png", ".jpg", ".jpeg", ".gif", ".svg"].includes(ext)) {
              const data = await fs.readFile(file);
              fileContents[path.basename(file)] = `data:image/${ext.slice(1)};base64,${data.toString("base64")}`;
            } else if ([".txt", ".json", ".csv"].includes(ext)) {
              const data = await fs.readFile(file, "utf-8");
              if (data.length < 100000) {
                fileContents[path.basename(file)] = data;
              }
            }
          }
          
          return {
            success: result.success,
            output: result.output,
            errors: result.errors,
            files: result.files.map(f => path.basename(f)),
            fileContents,
            events: result.events,
            timestamp: Date.now(),
          };
        } catch (error) {
          return {
            success: false,
            output: [],
            errors: [error instanceof Error ? error.message : "Unknown error"],
            files: [],
            fileContents: {},
            events: [],
            timestamp: Date.now(),
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
