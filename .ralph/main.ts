#!/usr/bin/env node

import { execSync, spawn, type StdioPipeNamed } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import * as errore from "errore";
import ora, { type Ora } from "ora";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const LOGS_DIR = resolve(__dirname, "logs");
const RUN_DIR = new Date().toISOString().replace(/[:.]/g, "-");
const WORKTREES_DIR = resolve(__dirname, "worktrees");
const isWindows = process.platform === "win32";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const MAX_ITERATIONS = 10;
const HELP_TEXT = `ralph - autonomous issue loop

Usage: ralph [options]

Options:
  -n, --iterations <num>  max iterations (default: ${MAX_ITERATIONS})
  -h, --help              show this help`;

interface CliFlags {
	iterations: number;
	help: boolean;
}

function cli(): CliFlags {
	const { values: flags } = parseArgs({
		options: {
			iterations: { type: "string", short: "n", default: "10" },
			help: { type: "boolean", short: "h", default: false },
		},
	});

	if (flags.help) {
		console.log(HELP_TEXT);
		process.exit(0);
	}

	const iterations = Math.min(parseInt(flags.iterations), MAX_ITERATIONS);

	return { ...flags, iterations };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ansi = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	cyan: "\x1b[36m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
};

const activeSpinners = new Set<Ora>();
const headerPrinted = new WeakSet<Ora>();

function printAboveSpinners(fn: () => void): void {
	for (const s of activeSpinners) s.clear();
	for (const s of activeSpinners) {
		if (!headerPrinted.has(s)) {
			headerPrinted.add(s);
			console.log(`${s.prefixText} ${s.text}`);
		}
	}
	fn();
	for (const s of activeSpinners) s.render();
}

const RALPH_TAG = "[ralph]";
const tag = {
	info: `${ansi.green}${ansi.bold}${RALPH_TAG}${ansi.reset}`,
	debug: `${ansi.cyan}${ansi.bold}${RALPH_TAG}${ansi.reset}`,
	warn: `${ansi.yellow}${ansi.bold}${RALPH_TAG}${ansi.reset}`,
	error: `${ansi.red}${ansi.bold}${RALPH_TAG}${ansi.reset}`,
};

const log = {
	info: (msg: string) => printAboveSpinners(() => console.log(`${tag.info} ${msg}`)),
	debug: (msg: string) =>
		printAboveSpinners(() => console.log(`${tag.debug} ${ansi.dim}${msg}${ansi.reset}`)),
	warn: (msg: string) => printAboveSpinners(() => console.log(`${tag.warn} ${msg}`)),
	error: (msg: string) => printAboveSpinners(() => console.log(`${tag.error} ${msg}`)),
};

function spin(label: string): Ora {
	const spinner = ora({ text: label, prefixText: tag.info }).start();
	activeSpinners.add(spinner);
	const origStop = spinner.stop.bind(spinner);
	spinner.stop = () => {
		activeSpinners.delete(spinner);
		return origStop();
	};
	return spinner;
}

function logFilePath(name: string): string {
	return resolve(LOGS_DIR, RUN_DIR, `${name}.log`);
}

interface ExecOptions {
	cwd?: string;
	encoding?: BufferEncoding;
	stdio?: StdioPipeNamed | StdioPipeNamed[];
}
function exec(
	cmd: string,
	{ cwd = ROOT_DIR, encoding = "utf-8", stdio = "pipe" }: ExecOptions = {},
): Error | string {
	return errore.try(() => execSync(cmd, { cwd, encoding, stdio }));
}

function createRunDir(): void {
	const runDir = resolve(LOGS_DIR, RUN_DIR);
	mkdirSync(runDir, { recursive: true });
}

function getCurrentBranch(): string {
	return execSync("git branch --show-current", {
		cwd: ROOT_DIR,
		encoding: "utf-8",
	}).trim();
}

/** Execute shell commands embedded in prompt markdown (!`cmd` syntax) */
function expandShellCommands(prompt: string): string {
	return prompt.replace(/!`([^`]+)`/g, (_, cmd: string) => {
		if (isWindows) {
			cmd = `powershell -Command "${cmd}"`;
		}

		log.debug(`Executing: ${cmd}`);

		const result = exec(cmd);
		if (result instanceof Error) {
			log.error(`Shell command failed: ${cmd}`);
			return `ERROR: ${cmd}`;
		}

		return result;
	});
}

function createWorktree(baseBranch: string, branch: string): string {
	const wtPath = resolve(WORKTREES_DIR, branch);
	const created = exec(`git worktree add "${wtPath}" -b "${branch}" "${baseBranch}"`);

	if (created instanceof Error) {
		// branch/worktree may already exist — try attaching to existing
		const attached = exec(`git worktree add "${wtPath}" "${branch}"`);
		if (attached instanceof Error) {
			log.debug(`Reusing existing worktree for ${branch}`);
		}
	}
	return wtPath;
}

function removeWorktree(wtPath: string): void {
	const result = exec(`git worktree remove "${wtPath}" --force`);

	if (result instanceof Error) {
		log.error(`Failed to remove worktree ${wtPath}`);
	}
}

function runAgent(
	prompt: string,
	opts: { cwd?: string; name?: string; logFile?: string } = {},
): Promise<Error | string> {
	return new Promise((resolve) => {
		const args = ["--print", "--dangerously-skip-permissions", "--verbose"];
		if (opts.name) args.push("--name", `ralph-${opts.name}`);
		const logFile = opts.logFile;
		const cmd = isWindows ? `powershell` : "claude";
		const spawnArgs = isWindows ? ["-Command", "claude", ...args] : args;
		const proc = spawn(cmd, spawnArgs, {
			cwd: opts.cwd ?? ROOT_DIR,
			stdio: "pipe",
		});
		// Pipe prompt via stdin to avoid Windows command-line length limits
		proc.stdin.write(prompt);
		proc.stdin.end();
		let stdout = "";
		let stderr = "";
		proc.stdout.on("data", (d: Buffer) => {
			const chunk = d.toString();
			stdout += chunk;
			if (logFile) appendFileSync(logFile, chunk);
		});
		proc.stderr.on("data", (d: Buffer) => {
			const chunk = d.toString();
			stderr += chunk;
			if (logFile) appendFileSync(logFile, "[stderr] " + chunk);
		});
		proc.on("close", (code) => {
			if (code !== 0) {
				resolve(new Error(`agent exited ${code}: ${stderr}`));
			} else {
				resolve(stdout);
			}
		});
	});
}

/** Read a prompt template from .ralph/ */
function readPromptFile(name: string): string {
	return readFileSync(resolve(__dirname, name), "utf-8");
}

// ---------------------------------------------------------------------------
// Step 1: Plan
// ---------------------------------------------------------------------------

interface PlannedIssue {
	number: number;
	title: string;
	branch: string;
}

async function plan(): Promise<Error | PlannedIssue[]> {
	const spinner = spin("Planning");

	const logFile = logFilePath("plan");
	writeFileSync(logFile, "");

	const prompt = expandShellCommands(readPromptFile("plan-prompt.md"));
	const output = await runAgent(prompt, { name: "plan", logFile });
	if (output instanceof Error) {
		spinner.fail("Planning");
		return output;
	}

	const match = output.match(/<plan>([\s\S]*?)<\/plan>/);
	if (!match) {
		spinner.fail("Planning");
		return new Error("No <plan> tag in planner output");
	}

	const parsed = JSON.parse(match[1]);
	const issues: PlannedIssue[] = parsed.issues;
	spinner.succeed(
		`Planned ${issues.length} unblocked issues: ${issues.map((i) => `#${i.number}`).join(", ")}`,
	);
	return issues;
}

// ---------------------------------------------------------------------------
// Step 2: Implement a single issue
// ---------------------------------------------------------------------------

async function implement(
	issue: PlannedIssue,
	baseBranch: string,
	logFile: string,
): Promise<Error | boolean> {
	const label = `Implementing #${issue.number} (${issue.title})`;
	const spinner = spin(label);

	const template = readPromptFile("implement-prompt.md");
	const prompt = expandShellCommands(
		template
			.replace(/\{\{ISSUE_NUMBER\}\}/g, String(issue.number))
			.replace(/\{\{ISSUE_TITLE\}\}/g, issue.title)
			.replace(/\{\{BRANCH\}\}/g, issue.branch),
	);

	const wtPath = createWorktree(baseBranch, issue.branch);
	const output = await runAgent(prompt, {
		cwd: wtPath,
		name: `impl-${issue.number}`,
		logFile,
	});
	if (output instanceof Error) {
		spinner.fail(label);
		return output;
	}

	const complete = output.includes("<promise>COMPLETE</promise>");
	const msg = `#${issue.number}: ${complete ? "COMPLETE" : "INCOMPLETE"}`;
	spinner.prefixText = complete ? tag.info : tag.warn;
	complete ? spinner.succeed(msg) : spinner.warn(msg);

	return complete;
}

// ---------------------------------------------------------------------------
// Step 3: Review a single issue
// ---------------------------------------------------------------------------

async function review(
	issue: PlannedIssue,
	baseBranch: string,
	logFile: string,
): Promise<Error | void> {
	const label = `Reviewing #${issue.number} (${issue.title})`;
	const spinner = spin(label);

	const template = readPromptFile("review-prompt.md");
	const prompt = expandShellCommands(
		template
			.replace(/\{\{ISSUE_NUMBER\}\}/g, String(issue.number))
			.replace(/\{\{ISSUE_TITLE\}\}/g, issue.title)
			.replace(/\{\{BRANCH\}\}/g, issue.branch)
			.replace(/\{\{BASE_BRANCH\}\}/g, baseBranch),
	);

	const wtPath = resolve(WORKTREES_DIR, issue.branch);
	const result = await runAgent(prompt, {
		cwd: wtPath,
		name: `review-${issue.number}`,
		logFile,
	});
	if (result instanceof Error) {
		spinner.fail(label);
		return result;
	}

	spinner.succeed(label);
}

// ---------------------------------------------------------------------------
// Step 3: Merge
// ---------------------------------------------------------------------------

async function merge(issues: PlannedIssue[], baseBranch: string): Promise<Error | void> {
	const spinner = spin("Merging");
	const template = readPromptFile("merge-prompt.md");

	const branches = issues.map((i) => `- ${i.branch}`).join("\n");
	const issuesList = issues.map((i) => `- #${i.number}: ${i.title} (${i.branch})`).join("\n");

	const prompt = template
		.replace(/\{\{BRANCHES\}\}/g, branches)
		.replace(/\{\{ISSUES\}\}/g, issuesList)
		.replace(/\{\{BASE_BRANCH\}\}/g, baseBranch);

	const logFile = logFilePath("merge");
	writeFileSync(logFile, "");

	const output = await runAgent(prompt, { name: "merge", logFile });
	if (output instanceof Error) {
		spinner.fail("Merging");
		return output;
	}

	const complete = output.includes("<promise>COMPLETE</promise>");
	const msg = `Merge: ${complete ? "COMPLETE" : "INCOMPLETE"}`;
	spinner.prefixText = complete ? tag.info : tag.warn;
	complete ? spinner.succeed(msg) : spinner.warn(msg);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const flags = cli();

	createRunDir();

	const baseBranch = getCurrentBranch();

	log.info(
		`Starting loop with ${ansi.bold}${flags.iterations}${ansi.reset} iterations on ${ansi.bold}${baseBranch}${ansi.reset}`,
	);

	for (let i = 1; i <= flags.iterations; i++) {
		log.info(`=== Iteration ${i}/${flags.iterations} ===`);

		const issues = await plan();
		if (issues instanceof Error) {
			log.error(issues.message);
			process.exit(1);
		}

		if (issues.length === 0) {
			log.info("No issues to work on, done");
			break;
		}

		const results = await Promise.allSettled(
			issues.map(async (issue) => {
				const logFile = logFilePath(`issue-${issue.number}`);
				writeFileSync(logFile, "");

				const complete = await implement(issue, baseBranch, logFile);
				if (complete instanceof Error) {
					log.error(complete.message);
					return { issue, complete: false };
				}

				if (complete) {
					const reviewErr = await review(issue, baseBranch, logFile);
					if (reviewErr instanceof Error) {
						log.error(reviewErr.message);
					}
				}

				return { issue, complete };
			}),
		);

		const completed = results
			.filter((r) => r.status === "fulfilled" && r.value.complete)
			.map((r) => (r.status === "fulfilled" ? r.value.issue : null))
			.filter((i): i is PlannedIssue => i !== null);

		log.info(`${completed.length}/${issues.length} issues completed`);

		// clean up worktrees
		for (const issue of issues) {
			removeWorktree(resolve(WORKTREES_DIR, issue.branch));
		}

		if (completed.length === 0) {
			log.warn("No completed issues, skipping merge");
			continue;
		}

		const mergeErr = await merge(completed, baseBranch);
		if (mergeErr instanceof Error) {
			log.error(mergeErr.message);
		}
	}

	log.info("Done");
}

main();
