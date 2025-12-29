/**
 * R Execution Service
 * Executes R code in a sandboxed environment with Firejail
 * Generates plots for meta-analysis
 */

import { spawn, execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// R script templates for meta-analysis
export const R_TEMPLATES = {
  meta_binary: `
library(meta)
library(metafor)
library(jsonlite)

data <- read.csv("{{INPUT}}")

ma <- metabin(
  event.e = {{EVENTS_INT}},
  n.e = {{N_INT}},
  event.c = {{EVENTS_CTRL}},
  n.c = {{N_CTRL}},
  studlab = paste({{STUDY}}, {{YEAR}}),
  data = data,
  sm = "{{MEASURE}}",
  random = TRUE,
  hakn = TRUE,
  prediction = TRUE
)

# Save summary
sink("{{OUTPUT}}/summary.txt")
print(summary(ma))
sink()

# Forest plot
png("{{OUTPUT}}/forest_plot.png", width = 1200, height = 800, res = 150)
forest(ma, sortvar = TE, prediction = TRUE)
dev.off()

# Funnel plot
png("{{OUTPUT}}/funnel_plot.png", width = 800, height = 600, res = 150)
funnel(ma)
dev.off()

# Results JSON
results <- list(
  k = ma$k,
  estimate = exp(ma$TE.random),
  ci_lower = exp(ma$lower.random),
  ci_upper = exp(ma$upper.random),
  p_value = ma$pval.random,
  i2 = ma$I2,
  tau2 = ma$tau2,
  prediction_lower = exp(ma$lower.predict),
  prediction_upper = exp(ma$upper.predict)
)
write_json(results, "{{OUTPUT}}/results.json")
cat("SUCCESS")
`,

  meta_continuous: `
library(meta)
library(jsonlite)

data <- read.csv("{{INPUT}}")

ma <- metacont(
  n.e = {{N_INT}},
  mean.e = {{MEAN_INT}},
  sd.e = {{SD_INT}},
  n.c = {{N_CTRL}},
  mean.c = {{MEAN_CTRL}},
  sd.c = {{SD_CTRL}},
  studlab = paste({{STUDY}}, {{YEAR}}),
  data = data,
  sm = "{{MEASURE}}",
  random = TRUE,
  hakn = TRUE
)

png("{{OUTPUT}}/forest_plot.png", width = 1200, height = 800, res = 150)
forest(ma, sortvar = TE, prediction = TRUE)
dev.off()

results <- list(
  k = ma$k,
  estimate = ma$TE.random,
  ci_lower = ma$lower.random,
  ci_upper = ma$upper.random,
  p_value = ma$pval.random,
  i2 = ma$I2,
  tau2 = ma$tau2
)
write_json(results, "{{OUTPUT}}/results.json")
cat("SUCCESS")
`,

  forest_plot: `
library(meta)

data <- read.csv("{{INPUT}}")

# Create meta object based on data structure
if ("events_int" %in% names(data)) {
  ma <- metabin(event.e = events_int, n.e = n_int,
                event.c = events_ctrl, n.c = n_ctrl,
                studlab = study, data = data, sm = "OR", random = TRUE)
} else if ("mean_int" %in% names(data)) {
  ma <- metacont(n.e = n_int, mean.e = mean_int, sd.e = sd_int,
                 n.c = n_ctrl, mean.c = mean_ctrl, sd.c = sd_ctrl,
                 studlab = study, data = data, sm = "MD", random = TRUE)
} else {
  ma <- metaprop(event = events, n = total, studlab = study, data = data)
}

png("{{OUTPUT}}", width = {{WIDTH}}, height = {{HEIGHT}}, res = 150)
forest(ma,
       sortvar = TE,
       prediction = TRUE,
       print.tau2 = TRUE,
       print.I2 = TRUE,
       col.square = "navy",
       col.diamond = "maroon")
dev.off()
cat("SUCCESS")
`,

  funnel_plot: `
library(meta)

data <- read.csv("{{INPUT}}")

if ("events_int" %in% names(data)) {
  ma <- metabin(event.e = events_int, n.e = n_int,
                event.c = events_ctrl, n.c = n_ctrl,
                studlab = study, data = data, sm = "OR", random = TRUE)
} else {
  ma <- metacont(n.e = n_int, mean.e = mean_int, sd.e = sd_int,
                 n.c = n_ctrl, mean.c = mean_ctrl, sd.c = sd_ctrl,
                 studlab = study, data = data, sm = "MD", random = TRUE)
}

png("{{OUTPUT}}", width = 800, height = 600, res = 150)
funnel(ma, studlab = TRUE)
dev.off()

# Egger's test
sink("{{OUTPUT}}.egger.txt")
print(metabias(ma))
sink()
cat("SUCCESS")
`,

  custom: `{{CODE}}`,
};

export interface RExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  files: string[];
  executionTime: number;
}

export interface RExecutionOptions {
  code: string;
  workDir?: string;
  timeout?: number;
  useSandbox?: boolean;
  allowNetwork?: boolean; // Allow network access for package installation or API calls
}

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
 * Execute R code in a sandboxed environment
 */
export async function executeR(options: RExecutionOptions): Promise<RExecutionResult> {
  const { code, timeout = 60000, useSandbox = true, allowNetwork = false } = options;
  const startTime = Date.now();
  
  // Create temp directory for this execution
  const workDir = options.workDir || await fs.mkdtemp(path.join(os.tmpdir(), "r-exec-"));
  const scriptPath = path.join(workDir, "script.R");
  
  try {
    // Write R script to file
    await fs.writeFile(scriptPath, code, "utf-8");
    
    // Determine execution method
    const useFirejail = useSandbox && isFirejailAvailable();
    
    // Build command
    let command: string;
    let args: string[];
    
    if (useFirejail) {
      // Use Firejail for sandboxed execution
      command = "firejail";
      args = [
        "--quiet",
        "--private-tmp",        // Isolated /tmp
        "--nogroups",           // Drop group privileges
        `--whitelist=${workDir}`, // Only allow work directory
        "--rlimit-cpu=300",     // 5 minute CPU limit
        "--rlimit-as=4294967296", // 4GB memory limit
      ];
      
      // Only block network if explicitly not needed
      if (!allowNetwork) {
        args.push("--net=none");
      }
      
      args.push("Rscript", "--vanilla", scriptPath);
    } else {
      // Fallback to direct execution with timeout
      command = "Rscript";
      args = ["--vanilla", scriptPath];
    }
    
    // Execute R script
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      const childProcess = spawn(command, args, {
        cwd: workDir,
        timeout,
        env: {
          ...process.env,
          R_LIBS_USER: "/usr/local/lib/R/site-library",
        },
      });
      
      let stdout = "";
      let stderr = "";
      
      childProcess.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      
      childProcess.on("close", (exitCode: number | null) => {
        if (exitCode === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`R process exited with code ${exitCode}: ${stderr}`));
        }
      });
      
      childProcess.on("error", (err: Error) => {
        reject(err);
      });
    });
    
    // Find generated files
    const files = await findGeneratedFiles(workDir);
    
    return {
      success: true,
      output: result.stdout,
      files,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
      files: [],
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Find all generated files in the work directory
 */
async function findGeneratedFiles(workDir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(workDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isFile() && !entry.name.endsWith(".R")) {
      files.push(path.join(workDir, entry.name));
    }
  }
  
  return files;
}

/**
 * Run a meta-analysis with the specified template
 */
export async function runMetaAnalysis(options: {
  template: keyof typeof R_TEMPLATES;
  inputFile: string;
  outputDir: string;
  params: Record<string, string | number>;
}): Promise<RExecutionResult> {
  const { template, inputFile, outputDir, params } = options;
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  // Get template and substitute parameters
  let code = R_TEMPLATES[template];
  code = code.replace("{{INPUT}}", inputFile);
  code = code.replace("{{OUTPUT}}", outputDir);
  
  for (const [key, value] of Object.entries(params)) {
    code = code.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  
  return executeR({ code, workDir: outputDir });
}

/**
 * Generate a forest plot from CSV data
 */
export async function generateForestPlot(options: {
  inputFile: string;
  outputFile: string;
  width?: number;
  height?: number;
}): Promise<RExecutionResult> {
  const { inputFile, outputFile, width = 1200, height = 800 } = options;
  
  let code = R_TEMPLATES.forest_plot;
  code = code.replace("{{INPUT}}", inputFile);
  code = code.replace("{{OUTPUT}}", outputFile);
  code = code.replace("{{WIDTH}}", String(width));
  code = code.replace("{{HEIGHT}}", String(height));
  
  const workDir = path.dirname(outputFile);
  await fs.mkdir(workDir, { recursive: true });
  
  return executeR({ code, workDir });
}

/**
 * Generate a funnel plot from CSV data
 */
export async function generateFunnelPlot(options: {
  inputFile: string;
  outputFile: string;
}): Promise<RExecutionResult> {
  const { inputFile, outputFile } = options;
  
  let code = R_TEMPLATES.funnel_plot;
  code = code.replace("{{INPUT}}", inputFile);
  code = code.replace("{{OUTPUT}}", outputFile);
  
  const workDir = path.dirname(outputFile);
  await fs.mkdir(workDir, { recursive: true });
  
  return executeR({ code, workDir });
}

/**
 * Check if R and required packages are available
 */
export async function checkREnvironment(): Promise<{
  available: boolean;
  version?: string;
  packages: Record<string, boolean>;
  sandbox: {
    firejail: boolean;
    bubblewrap: boolean;
  };
}> {
  // Check sandbox availability
  const firejailAvailable = isFirejailAvailable();
  let bubblewrapAvailable = false;
  try {
    execSync("which bwrap", { stdio: "ignore" });
    bubblewrapAvailable = true;
  } catch {
    // Not available
  }

  try {
    const checkCode = `
cat(paste("R version:", R.version.string, "\\n"))
packages <- c("meta", "metafor", "jsonlite", "ggplot2")
for (pkg in packages) {
  cat(paste(pkg, ":", requireNamespace(pkg, quietly = TRUE), "\\n"))
}
`;
    
    // Don't use sandbox for status check
    const result = await executeR({ code: checkCode, timeout: 10000, useSandbox: false });
    
    if (!result.success) {
      return { 
        available: false, 
        packages: {},
        sandbox: { firejail: firejailAvailable, bubblewrap: bubblewrapAvailable }
      };
    }
    
    const lines = result.output.split("\n");
    const version = lines.find(l => l.startsWith("R version:"))?.replace("R version:", "").trim();
    
    const packages: Record<string, boolean> = {};
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*:\s*(TRUE|FALSE)/);
      if (match) {
        packages[match[1]] = match[2] === "TRUE";
      }
    }
    
    return { 
      available: true, 
      version, 
      packages,
      sandbox: { firejail: firejailAvailable, bubblewrap: bubblewrapAvailable }
    };
  } catch {
    return { 
      available: false, 
      packages: {},
      sandbox: { firejail: firejailAvailable, bubblewrap: bubblewrapAvailable }
    };
  }
}

/**
 * Execute R code with automatic package installation
 */
export async function executeRWithPackages(options: {
  code: string;
  packages?: string[];
  timeout?: number;
}): Promise<RExecutionResult> {
  const { code, packages = [], timeout = 120000 } = options;
  
  // Build code with package loading
  let fullCode = "";
  
  if (packages.length > 0) {
    fullCode += `# Load required packages\n`;
    for (const pkg of packages) {
      fullCode += `if (!requireNamespace("${pkg}", quietly = TRUE)) {\n`;
      fullCode += `  install.packages("${pkg}", repos = "https://cloud.r-project.org/", quiet = TRUE)\n`;
      fullCode += `}\n`;
      fullCode += `library(${pkg})\n`;
    }
    fullCode += `\n`;
  }
  
  fullCode += code;
  
  return executeR({ code: fullCode, timeout });
}
