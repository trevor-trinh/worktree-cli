import Conf from 'conf';
import { name as packageName } from '../package.json';

// Define the structure of the configuration
interface ConfigSchema {
    defaultEditor: string;
}

// Initialize conf with a schema and project name
// Using the package name ensures a unique storage namespace
const schema: Conf.Schema<ConfigSchema> = {
    defaultEditor: {
        type: 'string',
        default: 'cursor', // Default editor is 'cursor'
    },
};

const config = new Conf<ConfigSchema>({
    projectName: packageName, // Use the actual package name
    schema,
});

// Function to get the default editor
export function getDefaultEditor(): string {
    return config.get('defaultEditor');
}

// Function to set the default editor
export function setDefaultEditor(editor: string): void {
    config.set('defaultEditor', editor);
}

// Function to get the path to the config file (for debugging/info)
export function getConfigPath(): string {
    return config.path;
} 