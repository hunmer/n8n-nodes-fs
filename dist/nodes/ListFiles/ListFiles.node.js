"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFiles = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const fileUtils_1 = require("../../utils/fileUtils");
// Helper functions
async function getFilesRecursively(dirPath, recursive, includeHidden, listMode, filterOptions, includeStats = true) {
    const files = [];
    const items = await fs_1.promises.readdir(dirPath);
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stats = await fs_1.promises.stat(fullPath);
        // Skip hidden files if not included
        if (!includeHidden && item.startsWith('.')) {
            continue;
        }
        const isDirectory = stats.isDirectory();
        const isFile = stats.isFile();
        // Apply list mode filter
        if (listMode === 'files' && !isFile)
            continue;
        if (listMode === 'directories' && !isDirectory)
            continue;
        // Apply file filters
        if (isFile && !passesFileFilters(fullPath, stats, filterOptions)) {
            continue;
        }
        const fileInfo = {
            name: item,
            path: fullPath,
            relativePath: path.relative(process.cwd(), fullPath),
            type: isDirectory ? 'directory' : 'file',
        };
        // Add file stats only if requested
        if (includeStats) {
            fileInfo.extension = isFile ? path.extname(item) : '';
            fileInfo.size = stats.size;
            fileInfo.sizeHuman = (0, fileUtils_1.formatFileSize)(stats.size);
            fileInfo.created = stats.birthtime;
            fileInfo.modified = stats.mtime;
            fileInfo.accessed = stats.atime;
            fileInfo.isFile = isFile;
            fileInfo.isDirectory = isDirectory;
            fileInfo.permissions = stats.mode;
        }
        files.push(fileInfo);
        // Recurse into subdirectories if enabled
        if (recursive && isDirectory) {
            const subFiles = await getFilesRecursively(fullPath, recursive, includeHidden, listMode, filterOptions, includeStats);
            files.push(...subFiles);
        }
    }
    return files;
}
function passesFileFilters(filePath, stats, filterOptions) {
    // Extension filter
    if (filterOptions.extensionFilter) {
        const extensions = filterOptions.extensionFilter
            .split(',')
            .map((ext) => ext.trim().toLowerCase());
        const fileExt = path.extname(filePath).toLowerCase();
        if (!extensions.includes(fileExt)) {
            return false;
        }
    }
    // Name pattern filter
    if (filterOptions.namePattern) {
        const regex = new RegExp(filterOptions.namePattern);
        const fileName = path.basename(filePath);
        if (!regex.test(fileName)) {
            return false;
        }
    }
    // Size filters
    if (filterOptions.minSize && stats.size < filterOptions.minSize) {
        return false;
    }
    if (filterOptions.maxSize && stats.size > filterOptions.maxSize) {
        return false;
    }
    return true;
}
function sortFiles(files, sortBy, sortOrder) {
    return files.sort((a, b) => {
        let aValue;
        let bValue;
        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'size':
                aValue = a.size;
                bValue = b.size;
                break;
            case 'modified':
                aValue = new Date(a.modified).getTime();
                bValue = new Date(b.modified).getTime();
                break;
            case 'created':
                aValue = new Date(a.created).getTime();
                bValue = new Date(b.created).getTime();
                break;
            case 'extension':
                aValue = a.extension.toLowerCase();
                bValue = b.extension.toLowerCase();
                break;
            default:
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
        }
        if (aValue < bValue) {
            return sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });
}
class ListFiles {
    constructor() {
        this.description = {
            displayName: 'List Files',
            name: 'listFiles',
            icon: 'fa:list',
            group: ['input'],
            version: 1,
            description: 'List files and directories in a path',
            defaults: {
                name: 'List Files',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                {
                    displayName: 'Directory Path',
                    name: 'directoryPath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/directory',
                    description: 'The directory path to list files from',
                },
                {
                    displayName: 'List Mode',
                    name: 'listMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Files Only',
                            value: 'files',
                            description: 'List only files',
                        },
                        {
                            name: 'Directories Only',
                            value: 'directories',
                            description: 'List only directories',
                        },
                        {
                            name: 'Both Files and Directories',
                            value: 'both',
                            description: 'List both files and directories',
                        },
                    ],
                    default: 'both',
                    description: 'What type of items to list',
                },
                {
                    displayName: 'Recursive',
                    name: 'recursive',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to search subdirectories recursively',
                },
                {
                    displayName: 'Include Hidden Files',
                    name: 'includeHidden',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to include hidden files and directories (starting with .)',
                },
                {
                    displayName: 'Filter Options',
                    name: 'filterOptions',
                    type: 'collection',
                    placeholder: 'Add Filter',
                    default: {},
                    options: [
                        {
                            displayName: 'File Extension Filter',
                            name: 'extensionFilter',
                            type: 'string',
                            default: '',
                            placeholder: '.txt,.js,.json',
                            description: 'Comma-separated list of file extensions to include (e.g., .txt,.js,.json)',
                        },
                        {
                            displayName: 'Name Pattern (Regex)',
                            name: 'namePattern',
                            type: 'string',
                            default: '',
                            placeholder: '^test.*\\.js$',
                            description: 'Regular expression pattern to match file/directory names',
                        },
                        {
                            displayName: 'Maximum Files',
                            name: 'maxFiles',
                            type: 'number',
                            default: 0,
                            description: 'Maximum number of files to return (0 = no limit)',
                        },
                        {
                            displayName: 'Min File Size (bytes)',
                            name: 'minSize',
                            type: 'number',
                            default: 0,
                            description: 'Minimum file size in bytes (0 = no limit)',
                        },
                        {
                            displayName: 'Max File Size (bytes)',
                            name: 'maxSize',
                            type: 'number',
                            default: 0,
                            description: 'Maximum file size in bytes (0 = no limit)',
                        },
                    ],
                },
                {
                    displayName: 'Output Options',
                    name: 'outputOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Include File Stats',
                            name: 'includeStats',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to include detailed file statistics',
                        },
                        {
                            displayName: 'Return as Single Array',
                            name: 'returnAsArray',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to return all files as a single array in one item',
                        },
                        {
                            displayName: 'Sort By',
                            name: 'sortBy',
                            type: 'options',
                            options: [
                                {
                                    name: 'Name',
                                    value: 'name',
                                },
                                {
                                    name: 'Size',
                                    value: 'size',
                                },
                                {
                                    name: 'Modified Date',
                                    value: 'modified',
                                },
                                {
                                    name: 'Created Date',
                                    value: 'created',
                                },
                                {
                                    name: 'Extension',
                                    value: 'extension',
                                },
                            ],
                            default: 'name',
                            description: 'How to sort the results',
                        },
                        {
                            displayName: 'Sort Order',
                            name: 'sortOrder',
                            type: 'options',
                            options: [
                                {
                                    name: 'Ascending',
                                    value: 'asc',
                                },
                                {
                                    name: 'Descending',
                                    value: 'desc',
                                },
                            ],
                            default: 'asc',
                            description: 'Sort order for results',
                        },
                    ],
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const directoryPath = this.getNodeParameter('directoryPath', i);
                const listMode = this.getNodeParameter('listMode', i);
                const recursive = this.getNodeParameter('recursive', i);
                const includeHidden = this.getNodeParameter('includeHidden', i);
                const filterOptions = this.getNodeParameter('filterOptions', i, {});
                const outputOptions = this.getNodeParameter('outputOptions', i, {});
                // Validate directory path
                if (!directoryPath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Directory path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(directoryPath);
                // Check if directory exists
                if (!(0, fs_2.existsSync)(absolutePath)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Directory not found: ${absolutePath}`, { itemIndex: i });
                }
                // Check if it's a directory
                const stats = await fs_1.promises.stat(absolutePath);
                if (!stats.isDirectory()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Path is not a directory: ${absolutePath}`, { itemIndex: i });
                }
                // Get files
                const files = await getFilesRecursively(absolutePath, recursive, includeHidden, listMode, filterOptions, outputOptions.includeStats !== false // 默认为true，除非明确设置为false
                );
                // Sort files if requested
                const sortedFiles = sortFiles(files, outputOptions.sortBy || 'name', outputOptions.sortOrder || 'asc');
                // Apply max files limit
                const maxFiles = filterOptions.maxFiles || 0;
                const finalFiles = maxFiles > 0 ? sortedFiles.slice(0, maxFiles) : sortedFiles;
                // Return data based on output options
                if (outputOptions.returnAsArray) {
                    returnData.push({
                        json: {
                            directoryPath: absolutePath,
                            fileCount: finalFiles.length,
                            files: finalFiles,
                            searchOptions: {
                                recursive,
                                includeHidden,
                                listMode,
                                ...filterOptions,
                            },
                        },
                        pairedItem: { item: i },
                    });
                }
                else {
                    // Return each file as a separate item
                    for (const file of finalFiles) {
                        returnData.push({
                            json: file,
                            pairedItem: { item: i },
                        });
                    }
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            directoryPath: this.getNodeParameter('directoryPath', i, ''),
                        },
                        pairedItem: { item: i },
                    });
                }
                else {
                    throw error;
                }
            }
        }
        return [returnData];
    }
}
exports.ListFiles = ListFiles;
//# sourceMappingURL=ListFiles.node.js.map