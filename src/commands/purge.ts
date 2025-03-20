import { execa } from "execa";
import chalk from "chalk";
import { stat, rm } from "node:fs/promises";
import readline from "node:readline";

// Utility function for interactive confirmation
function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (ans) => {
        rl.close();
        resolve(ans);
    }));
}

export async function purgeWorktreesHandler() {
    try {
        // Ensure we're in a Git repository
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        // Retrieve worktree list in porcelain format
        const { stdout } = await execa("git", ["worktree", "list", "--porcelain"]);
        const lines = stdout.split("\n");
        const worktrees: { path: string; branch: string }[] = [];
        let currentPath = "";

        // Parse worktree information from porcelain output
        for (const line of lines) {
            if (line.startsWith("worktree ")) {
                currentPath = line.replace("worktree ", "").trim();
            } else if (line.startsWith("branch ")) {
                const fullBranch = line.replace("branch ", "").trim();
                const branch = fullBranch.replace("refs/heads/", "");
                worktrees.push({ path: currentPath, branch });
            }
        }

        if (worktrees.length === 0) {
            console.log(chalk.yellow("No worktrees found."));
            return;
        }

        // Filter out the main branch worktree
        const purgeWorktrees = worktrees.filter((wt) => wt.branch !== "main");

        if (purgeWorktrees.length === 0) {
            console.log(chalk.green("No worktrees to purge (only main remains)."));
            return;
        }

        console.log(chalk.blue(`Found ${purgeWorktrees.length} worktree(s) to potentially purge:`));

        // Loop through each worktree and ask for confirmation before removal
        for (const wt of purgeWorktrees) {
            console.log(chalk.blue(`Worktree: Branch "${wt.branch}" at path "${wt.path}"`));
            const answer = await askQuestion(`Do you want to remove this worktree? (y/N): `);
            if (answer.toLowerCase() === "y") {
                console.log(chalk.blue(`Removing worktree for branch "${wt.branch}"...`));
                try {
                    // Remove worktree using Git
                    await execa("git", ["worktree", "remove", wt.path]);
                    console.log(chalk.green(`Removed worktree at ${wt.path}.`));
                } catch (removeError) {
                    // Check if error is about modified files
                    if (removeError instanceof Error && removeError.message.includes("modified or untracked files")) {
                        console.log(chalk.yellow(`Worktree contains modified or untracked files.`));
                        const forceAnswer = await askQuestion(`Do you want to force remove this worktree? (y/N): `);
                        if (forceAnswer.toLowerCase() === "y") {
                            await execa("git", ["worktree", "remove", "--force", wt.path]);
                            console.log(chalk.green(`Force removed worktree at ${wt.path}.`));
                        } else {
                            console.log(chalk.yellow(`Skipping removal for worktree "${wt.branch}".`));
                            continue;
                        }
                    } else {
                        // Re-throw if it's a different error
                        throw removeError;
                    }
                }

                // Optionally remove the physical directory if it still exists
                try {
                    await stat(wt.path);
                    await rm(wt.path, { recursive: true, force: true });
                    console.log(chalk.green(`Deleted folder ${wt.path}.`));
                } catch {
                    // If the directory doesn't exist, continue silently.
                }
            } else {
                console.log(chalk.yellow(`Skipping removal for worktree "${wt.branch}".`));
            }
        }

        console.log(chalk.green("Purge command completed."));
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Failed to purge worktrees:"), error.message);
        } else {
            console.error(chalk.red("Failed to purge worktrees:"), error);
        }
        process.exit(1);
    }
} 