/**
 * R Streaming Execution Service
 * Provides real-time line-by-line output from R code execution
 */

import { spawn, execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { EventEmitter } from "events";

export interface StreamingOptions {
  code: string;
  workDir?: string;
  timeout?: number;
  useSandbox?: boolean;
  allowNetwork?: boolean;
}

export interface StreamEvent {
  type: "stdout" | "stderr" | "status" | "file" | "complete" | "error";
  data: string;
  timestamp: number;
}

export type StreamCallback = (event: StreamEvent) => void;

/**
 * Check if firejail is available
 */
function isFirejailAvailable(): boolean {
  try {
    execSync("which firejail", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute R code with streaming output
 * Returns an event emitter that fires events for each line of output
 */
export function executeRStreaming(
  options: StreamingOptions,
  callback: StreamCallback
): { cancel: () => void; promise: Promise<{ success: boolean; files: string[] }> } {
  const { code, timeout = 120000, useSandbox = true, allowNetwork = false } = options;
  
  let cancelled = false;
  let childProcess: ReturnType<typeof spawn> | null = null;
  
  const cancel = () => {
    cancelled = true;
    if (childProcess) {
      childProcess.kill("SIGTERM");
    }
  };
  
  const promise = new Promise<{ success: boolean; files: string[] }>(async (resolve, reject) => {
    // Create temp directory for this execution
    const workDir = options.workDir || await fs.mkdtemp(path.join(os.tmpdir(), "r-stream-"));
    const scriptPath = path.join(workDir, "script.R");
    
    try {
      // Wrap code to flush output immediately
      const wrappedCode = `
# Enable immediate output flushing
options(warn = 1)
sink(stdout(), type = "message")

# Progress helper function
.progress <- function(msg) {
  cat(paste0("[PROGRESS] ", msg, "\\n"))
  flush.console()
}

# Status helper
.status <- function(msg) {
  cat(paste0("[STATUS] ", msg, "\\n"))
  flush.console()
}

.status("Starting R execution...")

${code}

.status("Execution complete")
`;
      
      // Write R script to file
      await fs.writeFile(scriptPath, wrappedCode, "utf-8");
      
      callback({
        type: "status",
        data: "Initializing R environment...",
        timestamp: Date.now(),
      });
      
      // Determine execution method
      const useFirejail = useSandbox && isFirejailAvailable();
      
      // Build command
      let command: string;
      let args: string[];
      
      if (useFirejail) {
        command = "firejail";
        args = [
          "--quiet",
          "--private-tmp",
          "--nogroups",
          `--whitelist=${workDir}`,
          "--rlimit-cpu=300",
          "--rlimit-as=4294967296",
        ];
        
        if (!allowNetwork) {
          args.push("--net=none");
        }
        
        args.push("Rscript", "--vanilla", scriptPath);
      } else {
        command = "Rscript";
        args = ["--vanilla", scriptPath];
      }
      
      callback({
        type: "status",
        data: useFirejail ? "Running in sandboxed environment..." : "Running R script...",
        timestamp: Date.now(),
      });
      
      // Execute R script
      childProcess = spawn(command, args, {
        cwd: workDir,
        env: {
          ...process.env,
          R_LIBS_USER: "/usr/local/lib/R/site-library",
        },
      });
      
      let stdoutBuffer = "";
      let stderrBuffer = "";
      
      // Process stdout line by line
      childProcess.stdout?.on("data", (data: Buffer) => {
        if (cancelled) return;
        
        stdoutBuffer += data.toString();
        const lines = stdoutBuffer.split("\n");
        
        // Keep the last incomplete line in buffer
        stdoutBuffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.trim()) {
            // Check for special markers
            if (line.startsWith("[PROGRESS]")) {
              callback({
                type: "status",
                data: line.replace("[PROGRESS] ", ""),
                timestamp: Date.now(),
              });
            } else if (line.startsWith("[STATUS]")) {
              callback({
                type: "status",
                data: line.replace("[STATUS] ", ""),
                timestamp: Date.now(),
              });
            } else {
              callback({
                type: "stdout",
                data: line,
                timestamp: Date.now(),
              });
            }
          }
        }
      });
      
      // Process stderr line by line
      childProcess.stderr?.on("data", (data: Buffer) => {
        if (cancelled) return;
        
        stderrBuffer += data.toString();
        const lines = stderrBuffer.split("\n");
        
        // Keep the last incomplete line in buffer
        stderrBuffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.trim()) {
            // Filter out common R noise
            if (!line.includes("Loading required package") && 
                !line.includes("Attaching package") &&
                !line.includes("The following objects are masked")) {
              callback({
                type: "stderr",
                data: line,
                timestamp: Date.now(),
              });
            }
          }
        }
      });
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        if (childProcess) {
          childProcess.kill("SIGTERM");
          callback({
            type: "error",
            data: `Execution timed out after ${timeout / 1000} seconds`,
            timestamp: Date.now(),
          });
        }
      }, timeout);
      
      childProcess.on("close", async (exitCode: number | null) => {
        clearTimeout(timeoutId);
        
        if (cancelled) {
          resolve({ success: false, files: [] });
          return;
        }
        
        // Flush remaining buffers
        if (stdoutBuffer.trim()) {
          callback({
            type: "stdout",
            data: stdoutBuffer,
            timestamp: Date.now(),
          });
        }
        if (stderrBuffer.trim()) {
          callback({
            type: "stderr",
            data: stderrBuffer,
            timestamp: Date.now(),
          });
        }
        
        // Find generated files
        const files: string[] = [];
        try {
          const entries = await fs.readdir(workDir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isFile() && !entry.name.endsWith(".R")) {
              const filePath = path.join(workDir, entry.name);
              files.push(filePath);
              
              // Notify about generated files
              callback({
                type: "file",
                data: filePath,
                timestamp: Date.now(),
              });
            }
          }
        } catch {
          // Ignore file listing errors
        }
        
        const success = exitCode === 0;
        
        callback({
          type: "complete",
          data: success ? "Execution completed successfully" : `Execution failed with code ${exitCode}`,
          timestamp: Date.now(),
        });
        
        resolve({ success, files });
      });
      
      childProcess.on("error", (err: Error) => {
        clearTimeout(timeoutId);
        
        callback({
          type: "error",
          data: err.message,
          timestamp: Date.now(),
        });
        
        resolve({ success: false, files: [] });
      });
      
    } catch (error) {
      callback({
        type: "error",
        data: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      });
      
      resolve({ success: false, files: [] });
    }
  });
  
  return { cancel, promise };
}

/**
 * Execute R code with streaming and collect all output
 */
export async function executeRWithStreaming(
  options: StreamingOptions
): Promise<{
  success: boolean;
  output: string[];
  errors: string[];
  files: string[];
  events: StreamEvent[];
}> {
  const output: string[] = [];
  const errors: string[] = [];
  const events: StreamEvent[] = [];
  
  const callback: StreamCallback = (event) => {
    events.push(event);
    if (event.type === "stdout") {
      output.push(event.data);
    } else if (event.type === "stderr" || event.type === "error") {
      errors.push(event.data);
    }
  };
  
  const { promise } = executeRStreaming(options, callback);
  const result = await promise;
  
  return {
    success: result.success,
    output,
    errors,
    files: result.files,
    events,
  };
}

/**
 * Create a streaming session that can be subscribed to
 */
export class RStreamingSession extends EventEmitter {
  private cancelled = false;
  private workDir: string | null = null;
  
  async execute(options: StreamingOptions): Promise<{ success: boolean; files: string[] }> {
    this.cancelled = false;
    
    const callback: StreamCallback = (event) => {
      if (!this.cancelled) {
        this.emit("event", event);
        this.emit(event.type, event.data);
      }
    };
    
    const { cancel, promise } = executeRStreaming(options, callback);
    
    this.once("cancel", () => {
      this.cancelled = true;
      cancel();
    });
    
    return promise;
  }
  
  cancel(): void {
    this.cancelled = true;
    this.emit("cancel");
  }
}
