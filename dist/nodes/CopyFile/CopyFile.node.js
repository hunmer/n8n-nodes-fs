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
exports.CopyFile = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const fileUtils_1 = require("../../utils/fileUtils");
class CopyFile {
    constructor() {
        this.description = {
            displayName: 'Copy File',
            name: 'copyFile',
            icon: 'fa:copy',
            group: ['transform'],
            version: 1,
            description: 'Copy files or directories to another location',
            defaults: {
                name: 'Copy File',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                {
                    displayName: 'Source Path',
                    name: 'sourcePath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/source/file',
                    description: 'The path of the file or directory to copy',
                },
                {
                    displayName: 'Destination Path',
                    name: 'destinationPath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/destination/file',
                    description: 'The destination path for the copied file or directory',
                },
                {
                    displayName: 'Copy Options',
                    name: 'copyOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Overwrite Existing',
                            name: 'overwrite',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to overwrite existing files at destination',
                        },
                        {
                            displayName: 'Preserve Timestamps',
                            name: 'preserveTimestamps',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to preserve original file timestamps',
                        },
                        {
                            displayName: 'Create Destination Directory',
                            name: 'createDestDir',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to create destination directory if it doesn\'t exist',
                        },
                        {
                            displayName: 'Copy Mode',
                            name: 'copyMode',
                            type: 'options',
                            options: [
                                {
                                    name: 'File Only',
                                    value: 'file',
                                    description: 'Copy only if source is a file',
                                },
                                {
                                    name: 'Directory Only',
                                    value: 'directory',
                                    description: 'Copy only if source is a directory',
                                },
                                {
                                    name: 'Auto Detect',
                                    value: 'auto',
                                    description: 'Automatically detect and copy file or directory',
                                },
                            ],
                            default: 'auto',
                            description: 'What type of item to copy',
                        },
                        {
                            displayName: 'Recursive (Directories)',
                            name: 'recursive',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to copy directories recursively with all contents',
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
                const sourcePath = this.getNodeParameter('sourcePath', i);
                const destinationPath = this.getNodeParameter('destinationPath', i);
                const copyOptions = this.getNodeParameter('copyOptions', i, {});
                const overwrite = copyOptions.overwrite || false;
                const preserveTimestamps = copyOptions.preserveTimestamps !== false;
                const createDestDir = copyOptions.createDestDir !== false;
                const copyMode = copyOptions.copyMode || 'auto';
                const recursive = copyOptions.recursive !== false;
                // Validate paths
                if (!sourcePath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Source path is required', { itemIndex: i });
                }
                if (!destinationPath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Destination path is required', { itemIndex: i });
                }
                // Resolve absolute paths
                const absoluteSourcePath = path.resolve(sourcePath);
                const absoluteDestPath = path.resolve(destinationPath);
                // Check if source exists
                if (!(0, fs_2.existsSync)(absoluteSourcePath)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Source path not found: ${absoluteSourcePath}`, { itemIndex: i });
                }
                // Get source stats
                const sourceStats = await fs_1.promises.stat(absoluteSourcePath);
                const isSourceFile = sourceStats.isFile();
                const isSourceDirectory = sourceStats.isDirectory();
                // Validate copy mode
                if (copyMode === 'file' && !isSourceFile) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Source is not a file (copy mode is 'file'): ${absoluteSourcePath}`, { itemIndex: i });
                }
                if (copyMode === 'directory' && !isSourceDirectory) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Source is not a directory (copy mode is 'directory'): ${absoluteSourcePath}`, { itemIndex: i });
                }
                // Check if destination exists
                const destExists = (0, fs_2.existsSync)(absoluteDestPath);
                if (destExists && !overwrite) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Destination already exists and overwrite is disabled: ${absoluteDestPath}`, { itemIndex: i });
                }
                // Create destination directory if needed
                if (createDestDir) {
                    const destDir = isSourceFile ? path.dirname(absoluteDestPath) : path.dirname(absoluteDestPath);
                    if (!(0, fs_2.existsSync)(destDir)) {
                        await fs_1.promises.mkdir(destDir, { recursive: true });
                    }
                }
                // Perform copy operation
                const copyStartTime = Date.now();
                let copiedBytes = 0;
                if (isSourceFile) {
                    await fs_1.promises.copyFile(absoluteSourcePath, absoluteDestPath);
                    copiedBytes = sourceStats.size;
                    // Preserve timestamps if requested
                    if (preserveTimestamps) {
                        await fs_1.promises.utimes(absoluteDestPath, sourceStats.atime, sourceStats.mtime);
                    }
                }
                else if (isSourceDirectory && recursive) {
                    copiedBytes = await (0, fileUtils_1.copyDirectoryRecursive)(absoluteSourcePath, absoluteDestPath, preserveTimestamps);
                }
                else if (isSourceDirectory && !recursive) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Cannot copy directory without recursive option enabled', { itemIndex: i });
                }
                const copyEndTime = Date.now();
                // Get destination stats
                const destStats = await fs_1.promises.stat(absoluteDestPath);
                // Prepare return data
                const returnItem = {
                    success: true,
                    copied: true,
                    sourcePath: absoluteSourcePath,
                    destinationPath: absoluteDestPath,
                    sourceType: isSourceFile ? 'file' : 'directory',
                    sourceName: path.basename(absoluteSourcePath),
                    destinationName: path.basename(absoluteDestPath),
                    copiedBytes,
                    copiedSizeHuman: (0, fileUtils_1.formatFileSize)(copiedBytes),
                    copyTime: copyEndTime - copyStartTime,
                    copiedAt: new Date().toISOString(),
                    preservedTimestamps: preserveTimestamps,
                    overwriteMode: overwrite,
                    recursive: isSourceDirectory ? recursive : undefined,
                };
                returnData.push({
                    json: returnItem,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            success: false,
                            copied: false,
                            error: error.message,
                            sourcePath: this.getNodeParameter('sourcePath', i, ''),
                            destinationPath: this.getNodeParameter('destinationPath', i, ''),
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
    async copyDirectoryRecursive(sourcePath, destPath, preserveTimestamps) {
        let totalBytes = 0;
        // Create destination directory
        await fs_1.promises.mkdir(destPath, { recursive: true });
        // Get directory contents
        const items = await fs_1.promises.readdir(sourcePath);
        for (const item of items) {
            const sourceItemPath = path.join(sourcePath, item);
            const destItemPath = path.join(destPath, item);
            const stats = await fs_1.promises.stat(sourceItemPath);
            if (stats.isFile()) {
                await fs_1.promises.copyFile(sourceItemPath, destItemPath);
                totalBytes += stats.size;
                if (preserveTimestamps) {
                    await fs_1.promises.utimes(destItemPath, stats.atime, stats.mtime);
                }
            }
            else if (stats.isDirectory()) {
                const subdirBytes = await this.copyDirectoryRecursive(sourceItemPath, destItemPath, preserveTimestamps);
                totalBytes += subdirBytes;
            }
        }
        // Preserve directory timestamps
        if (preserveTimestamps) {
            const sourceStats = await fs_1.promises.stat(sourcePath);
            await fs_1.promises.utimes(destPath, sourceStats.atime, sourceStats.mtime);
        }
        return totalBytes;
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
exports.CopyFile = CopyFile;
//# sourceMappingURL=CopyFile.node.js.map