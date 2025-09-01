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
exports.MoveFile = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const fileUtils_1 = require("../../utils/fileUtils");
class MoveFile {
    constructor() {
        this.description = {
            displayName: 'Move File',
            name: 'moveFile',
            icon: 'fa:arrow-right',
            group: ['transform'],
            version: 1,
            description: 'Move or rename files and directories',
            defaults: {
                name: 'Move File',
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
                    description: 'The path of the file or directory to move',
                },
                {
                    displayName: 'Destination Path',
                    name: 'destinationPath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/destination/file',
                    description: 'The destination path for the moved file or directory',
                },
                {
                    displayName: 'Move Options',
                    name: 'moveOptions',
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
                            displayName: 'Create Destination Directory',
                            name: 'createDestDir',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to create destination directory if it doesn\'t exist',
                        },
                        {
                            displayName: 'Move Mode',
                            name: 'moveMode',
                            type: 'options',
                            options: [
                                {
                                    name: 'File Only',
                                    value: 'file',
                                    description: 'Move only if source is a file',
                                },
                                {
                                    name: 'Directory Only',
                                    value: 'directory',
                                    description: 'Move only if source is a directory',
                                },
                                {
                                    name: 'Auto Detect',
                                    value: 'auto',
                                    description: 'Automatically detect and move file or directory',
                                },
                            ],
                            default: 'auto',
                            description: 'What type of item to move',
                        },
                        {
                            displayName: 'Fallback to Copy+Delete',
                            name: 'fallbackCopy',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to fallback to copy+delete if atomic move fails (cross-filesystem)',
                        },
                        {
                            displayName: 'Backup Original',
                            name: 'createBackup',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to create a backup before moving (for safety)',
                        },
                        {
                            displayName: 'Backup Directory',
                            name: 'backupDirectory',
                            type: 'string',
                            displayOptions: {
                                show: {
                                    createBackup: [true],
                                },
                            },
                            default: '',
                            placeholder: '/path/to/backup/directory',
                            description: 'Directory to store backups (uses temp if empty)',
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
                const moveOptions = this.getNodeParameter('moveOptions', i, {});
                const overwrite = moveOptions.overwrite || false;
                const createDestDir = moveOptions.createDestDir !== false;
                const moveMode = moveOptions.moveMode || 'auto';
                const fallbackCopy = moveOptions.fallbackCopy !== false;
                const createBackup = moveOptions.createBackup || false;
                const backupDirectory = moveOptions.backupDirectory || '';
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
                // Validate move mode
                if (moveMode === 'file' && !isSourceFile) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Source is not a file (move mode is 'file'): ${absoluteSourcePath}`, { itemIndex: i });
                }
                if (moveMode === 'directory' && !isSourceDirectory) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Source is not a directory (move mode is 'directory'): ${absoluteSourcePath}`, { itemIndex: i });
                }
                // Check if destination exists
                const destExists = (0, fs_2.existsSync)(absoluteDestPath);
                if (destExists && !overwrite) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Destination already exists and overwrite is disabled: ${absoluteDestPath}`, { itemIndex: i });
                }
                // Create destination directory if needed
                if (createDestDir) {
                    const destDir = path.dirname(absoluteDestPath);
                    if (!(0, fs_2.existsSync)(destDir)) {
                        await fs_1.promises.mkdir(destDir, { recursive: true });
                    }
                }
                // Create backup if requested
                let backupPath = '';
                if (createBackup) {
                    const backupDir = backupDirectory || '/tmp';
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const backupName = `${path.basename(absoluteSourcePath)}.backup.${timestamp}`;
                    backupPath = path.join(backupDir, backupName);
                    // Ensure backup directory exists
                    await fs_1.promises.mkdir(path.dirname(backupPath), { recursive: true });
                    if (isSourceFile) {
                        await fs_1.promises.copyFile(absoluteSourcePath, backupPath);
                    }
                    else if (isSourceDirectory) {
                        // For directories, create a simple backup reference
                        await fs_1.promises.writeFile(backupPath + '.info', JSON.stringify({
                            originalPath: absoluteSourcePath,
                            backupTime: new Date().toISOString(),
                            type: 'directory',
                            note: 'Directory backup - original was moved'
                        }));
                    }
                }
                // Perform move operation
                const moveStartTime = Date.now();
                let moveMethod = 'atomic';
                try {
                    // Try atomic rename first (fastest)
                    await fs_1.promises.rename(absoluteSourcePath, absoluteDestPath);
                }
                catch (renameError) {
                    if (fallbackCopy) {
                        // Fallback to copy + delete (for cross-filesystem moves)
                        moveMethod = 'copy-delete';
                        if (isSourceFile) {
                            await fs_1.promises.copyFile(absoluteSourcePath, absoluteDestPath);
                            await fs_1.promises.unlink(absoluteSourcePath);
                        }
                        else if (isSourceDirectory) {
                            await (0, fileUtils_1.copyDirectoryRecursive)(absoluteSourcePath, absoluteDestPath);
                            await fs_1.promises.rmdir(absoluteSourcePath, { recursive: true });
                        }
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Move failed and fallback is disabled: ${renameError.message}`, { itemIndex: i });
                    }
                }
                const moveEndTime = Date.now();
                // Get destination stats
                const destStats = await fs_1.promises.stat(absoluteDestPath);
                // Prepare return data
                const returnItem = {
                    success: true,
                    moved: true,
                    sourcePath: absoluteSourcePath,
                    destinationPath: absoluteDestPath,
                    sourceType: isSourceFile ? 'file' : 'directory',
                    sourceName: path.basename(absoluteSourcePath),
                    destinationName: path.basename(absoluteDestPath),
                    size: destStats.size,
                    sizeHuman: (0, fileUtils_1.formatFileSize)(destStats.size),
                    moveTime: moveEndTime - moveStartTime,
                    moveMethod,
                    movedAt: new Date().toISOString(),
                    overwriteMode: overwrite,
                    isRename: path.dirname(absoluteSourcePath) === path.dirname(absoluteDestPath),
                };
                if (backupPath) {
                    returnItem.backupPath = backupPath;
                }
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
                            moved: false,
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
    async copyDirectoryRecursive(sourcePath, destPath) {
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
            }
            else if (stats.isDirectory()) {
                await this.copyDirectoryRecursive(sourceItemPath, destItemPath);
            }
        }
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
exports.MoveFile = MoveFile;
//# sourceMappingURL=MoveFile.node.js.map