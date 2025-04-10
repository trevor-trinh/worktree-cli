import { execa } from "execa";
import chalk from "chalk";

export async function getCurrentBranch(): Promise<string | null> {
    try {
        // Use symbolic-ref for a more reliable way to get the branch name,
        // falling back to rev-parse --abbrev-ref if in detached HEAD
        let branchName: string;
        try {
            const { stdout } = await execa("git", ["symbolic-ref", "--short", "HEAD"]);
            branchName = stdout.trim();
        } catch (symbolicRefError) {
            // Likely detached HEAD state
            const { stdout } = await execa("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
            branchName = stdout.trim();
            if (branchName === 'HEAD') {
                // Still 'HEAD' means we are truly detached, not just that symbolic-ref failed
                console.warn(chalk.yellow("Currently in a detached HEAD state."));
                return null; // Or handle as an error depending on requirements
            }
        }
        return branchName;
    } catch (error: any) {
        console.error(chalk.red("Failed to get current branch name:"), error.stderr || error.message);
        return null;
    }
}

// Add other git-related utilities here in the future 