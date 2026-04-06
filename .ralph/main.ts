#!/usr/bin/env node

import { execSync, spawn, type StdioPipeNamed } from "node:child_process";
import { readFileSync, mkdirSync, appendFileSync, openSync, closeSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import * as errore from "errore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const LOGS_DIR = resolve(__dirname, "logs", new Date().toISOString().replace(/[:.]/g, "-"));
const RALPH_LOG_FILE = resolve(LOGS_DIR, "ralph.log");
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

function log(msg: string): void {
	msg = `[ralph][${new Date().toISOString()}] ${msg}`;
	console.log(msg);
	appendFileSync(RALPH_LOG_FILE, msg + "\n");
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

function getCurrentBranch(): string {
	return execSync("git branch --show-current", {
		cwd: ROOT_DIR,
		encoding: "utf-8",
	}).trim();
}

/** Execute shell commands embedded in prompt markdown (!`cmd` syntax) */
function expandShellCommands(prompt: string): string {
	return prompt.replace(/!`([^`]+)`/g, (_, cmd: string) => {
		log(`Executing: ${cmd}`);

		const result = exec(isWindows ? `powershell -Command "${cmd}"` : cmd);
		if (result instanceof Error) {
			log(`Command failed: ${cmd}\n${result.message}`);
			return `ERROR: ${cmd}\n${result.message}`;
		}

		return result;
	});
}

function createWorktree(baseBranch: string, branch: string): string {
	const wtPath = resolve(WORKTREES_DIR, branch);
	const created = exec(`git worktree add "${wtPath}" -b "${branch}" "${baseBranch}"`);

	if (created instanceof Error) {
		// branch may already exist from a prior run — reset it to baseBranch
		exec(`git branch -f "${branch}" "${baseBranch}"`);
		const attached = exec(`git worktree add "${wtPath}" "${branch}"`);
		if (attached instanceof Error) {
			log(`Reusing existing worktree for ${branch}`);
		}
	}

	return wtPath;
}

function removeWorktree(wtPath: string): void {
	const result = exec(`git worktree remove "${wtPath}" --force`);

	if (result instanceof Error) {
		log(`Failed to remove worktree ${wtPath}`);
	}
}

function fileSize(path: string): number {
	try {
		return statSync(path).size;
	} catch {
		return 0;
	}
}

function runAgent(
	prompt: string,
	opts: { cwd?: string; name?: string; logFile: string },
): Promise<Error | string> {
	return new Promise((res) => {
		const args = ["--print", "--dangerously-skip-permissions", "--verbose"];
		if (opts.name) args.push("--name", `ralph-${opts.name}`);

		const logFile = opts.logFile;
		const logFileFd = openSync(logFile, "a");

		const cmd = isWindows ? `powershell` : "claude";
		const spawnArgs = isWindows ? ["-Command", "claude", ...args] : args;

		const proc = spawn(cmd, spawnArgs, {
			cwd: opts.cwd ?? ROOT_DIR,
			stdio: ["pipe", logFileFd, logFileFd],
		});

		// Pipe prompt via stdin to avoid Windows command-line length limits
		proc.stdin!.write(prompt);
		proc.stdin!.end();

		proc.on("close", (code) => {
			closeSync(logFileFd);

			if (code !== 0) {
				res(new Error(`agent exited ${code}`));
			} else {
				res(readFileSync(logFile, "utf-8"));
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

async function plan(iteration: number): Promise<Error | PlannedIssue[]> {
	const logFile = resolve(LOGS_DIR, `${iteration}-plan.log`);
	log(`Plan -> ${logFile}`);

	const prompt = expandShellCommands(readPromptFile("plan-prompt.md"));
	const output = await runAgent(prompt, { name: "plan", logFile });
	if (output instanceof Error) {
		return output;
	}

	const match = output.match(/<plan>([\s\S]*?)<\/plan>/);
	if (!match) {
		return new Error("No <plan> tag in planner output");
	}

	const parsed = JSON.parse(match[1]);
	const issues: PlannedIssue[] = parsed.issues;
	log(
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
		return output;
	}

	return output.includes("<promise>COMPLETE</promise>");
}

// ---------------------------------------------------------------------------
// Step 3: Review a single issue
// ---------------------------------------------------------------------------

async function review(
	issue: PlannedIssue,
	baseBranch: string,
	logFile: string,
): Promise<Error | void> {
	appendFileSync(logFile, "\n==== REVIEW ====\n");

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
		return result;
	}
}

// ---------------------------------------------------------------------------
// Step 3: Merge
// ---------------------------------------------------------------------------

async function merge(
	issues: PlannedIssue[],
	baseBranch: string,
	iteration: number,
): Promise<Error | void> {
	const logFile = resolve(LOGS_DIR, `${iteration}-merge.log`);
	log(`Merge -> ${logFile}`);

	const template = readPromptFile("merge-prompt.md");
	const branches = issues.map((i) => `- ${i.branch}`).join("\n");
	const issuesList = issues.map((i) => `- #${i.number}: ${i.title} (${i.branch})`).join("\n");

	const prompt = template
		.replace(/\{\{BRANCHES\}\}/g, branches)
		.replace(/\{\{ISSUES\}\}/g, issuesList)
		.replace(/\{\{BASE_BRANCH\}\}/g, baseBranch);

	const output = await runAgent(prompt, { name: "merge", logFile });
	if (output instanceof Error) {
		return output;
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const flags = cli();

	mkdirSync(LOGS_DIR, { recursive: true });
	mkdirSync(WORKTREES_DIR, { recursive: true });

	const baseBranch = getCurrentBranch();

	log(`Starting loop with ${flags.iterations} iterations, base branch "${baseBranch}"`);

	for (let iteration = 1; iteration <= flags.iterations; iteration++) {
		log(`==== Iteration ${iteration}/${flags.iterations} ====`);

		const issues = await plan(iteration);
		if (issues instanceof Error) {
			log(`Planning failed: ${issues.message}`);
			process.exit(1);
			return;
		}

		if (issues.length === 0) {
			log("No issues to work on, done");
			break;
		}

		const results = await Promise.all(
			issues.map(async (issue) => {
				const logFile = resolve(LOGS_DIR, `${iteration}-issue-${issue.number}.log`);
				log(`Issue #${issue.number} (${issue.title}) -> ${logFile}`);

				const complete = await implement(issue, baseBranch, logFile);
				if (complete instanceof Error) {
					log(`Implementation failed for issue #${issue.number}: ${complete.message}`);
					return null;
				}

				if (!complete) return null;

				const reviewErr = await review(issue, baseBranch, logFile);
				if (reviewErr instanceof Error) {
					log(`Review failed for issue #${issue.number}: ${reviewErr.message}`);
					return null;
				}

				return issue;
			}),
		);

		const completed = results.filter((r): r is PlannedIssue => r !== null);

		log(`${completed.length}/${issues.length} issues completed`);

		// clean up worktrees
		for (const issue of issues) {
			removeWorktree(resolve(WORKTREES_DIR, issue.branch));
		}

		if (completed.length === 0) {
			log("No completed issues, skipping merge");
			continue;
		}

		const mergeErr = await merge(completed, baseBranch, iteration);
		if (mergeErr instanceof Error) {
			log(`Merge failed: ${mergeErr.message}`);
		}
	}

	log("Done");
}

main();
