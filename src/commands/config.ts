import chalk from 'chalk';
import { getDefaultEditor, setDefaultEditor, getConfigPath, getDefaultWorktreePath, setDefaultWorktreePath, clearDefaultWorktreePath } from '../config.js';

export async function configHandler(action: 'get' | 'set' | 'path' | 'clear', key?: string, value?: string) {
    try {
        switch (action) {
            case 'get':
                if (key === 'editor') {
                    const editor = getDefaultEditor();
                    console.log(chalk.blue(`Default editor is currently set to: ${chalk.bold(editor)}`));
                } else if (key === 'worktreepath') {
                    const worktreePath = getDefaultWorktreePath();
                    if (worktreePath) {
                        console.log(chalk.blue(`Default worktree path is currently set to: ${chalk.bold(worktreePath)}`));
                    } else {
                        console.log(chalk.yellow('No default worktree path configured. Using sibling directory behavior.'));
                    }
                } else {
                    console.error(chalk.red(`Unknown configuration key to get: ${key}`));
                    process.exit(1);
                }
                break;
            case 'set':
                if (key === 'editor' && value) {
                    setDefaultEditor(value);
                    console.log(chalk.green(`Default editor set to: ${chalk.bold(value)}`));
                } else if (key === 'editor') {
                    console.error(chalk.red(`You must provide an editor name.`));
                    process.exit(1);
                } else if (key === 'worktreepath' && value) {
                    setDefaultWorktreePath(value);
                    const resolvedPath = getDefaultWorktreePath(); // Get the resolved absolute path
                    console.log(chalk.green(`Default worktree path set to: ${chalk.bold(resolvedPath)}`));
                } else if (key === 'worktreepath') {
                    console.error(chalk.red(`You must provide a path.`));
                    process.exit(1);
                } else {
                    console.error(chalk.red(`Unknown configuration key to set: ${key}`));
                    process.exit(1);
                }
                break;
            case 'path':
                const configPath = getConfigPath();
                console.log(chalk.blue(`Configuration file path: ${configPath}`));
                break;
            case 'clear':
                if (key === 'worktreepath') {
                    clearDefaultWorktreePath();
                    console.log(chalk.green('Default worktree path cleared. Will use sibling directory behavior.'));
                } else {
                    console.error(chalk.red(`Unknown configuration key to clear: ${key}`));
                    process.exit(1);
                }
                break;
            default:
                console.error(chalk.red(`Unknown config action: ${action}`));
                process.exit(1);
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red('Configuration command failed:'), error.message);
        } else {
            console.error(chalk.red('Configuration command failed:'), error);
        }
        process.exit(1);
    }
} 