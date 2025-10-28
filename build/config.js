import Conf from 'conf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Read package.json dynamically instead of using named imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageName = packageJson.name;
// Initialize conf with a schema and project name
// Using the package name ensures a unique storage namespace
const schema = {
    defaultEditor: {
        type: 'string',
        default: 'cursor', // Default editor is 'cursor'
    },
    defaultWorktreePath: {
        type: 'string',
        default: undefined, // No default, falls back to sibling directory behavior
    },
};
const config = new Conf({
    projectName: packageName, // Use the actual package name
    schema,
});
// Function to get the default editor
export function getDefaultEditor() {
    return config.get('defaultEditor');
}
// Function to set the default editor
export function setDefaultEditor(editor) {
    config.set('defaultEditor', editor);
}
// Function to get the path to the config file (for debugging/info)
export function getConfigPath() {
    return config.path;
}
// Function to get the default worktree path
export function getDefaultWorktreePath() {
    return config.get('defaultWorktreePath');
}
// Function to set the default worktree path
export function setDefaultWorktreePath(worktreePath) {
    // Resolve to absolute path and expand ~ to home directory
    const resolvedPath = worktreePath.startsWith('~')
        ? path.join(process.env.HOME || process.env.USERPROFILE || '', worktreePath.slice(1))
        : path.resolve(worktreePath);
    config.set('defaultWorktreePath', resolvedPath);
}
// Function to clear the default worktree path
export function clearDefaultWorktreePath() {
    config.delete('defaultWorktreePath');
}
