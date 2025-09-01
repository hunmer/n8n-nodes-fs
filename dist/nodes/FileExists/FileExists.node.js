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
exports.FileExists = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
class FileExists {
    constructor() {
        this.description = {
            displayName: 'File Exists',
            name: 'fileExists',
            icon: 'fa:search',
            group: ['input'],
            version: 1,
            description: 'Check if a file or directory exists',
            defaults: {
                name: 'File Exists',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                {
                    displayName: 'Path',
                    name: 'filePath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/file/or/directory',
                    description: 'The path to check for existence',
                },
                {
                    displayName: 'Check Options',
                    name: 'checkOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Check Type',
                            name: 'checkType',
                            type: 'options',
                            options: [
                                {
                                    name: 'Any (File or Directory)',
                                    value: 'any',
                                    description: 'Check if path exists (file or directory)',
                                },
                                {
                                    name: 'File Only',
                                    value: 'file',
                                    description: 'Check if path exists and is a file',
                                },
                                {
                                    name: 'Directory Only',
                                    value: 'directory',
                                    description: 'Check if path exists and is a directory',
                                },
                            ],
                            default: 'any',
                            description: 'What type of path to check for',
                        },
                        {
                            displayName: 'Include Details',
                            name: 'includeDetails',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include detailed information about the path (size, permissions, etc.)',
                        },
                        {
                            displayName: 'Check Access',
                            name: 'checkAccess',
                            type: 'multiOptions',
                            options: [
                                {
                                    name: 'Readable',
                                    value: 'readable',
                                },
                                {
                                    name: 'Writable',
                                    value: 'writable',
                                },
                                {
                                    name: 'Executable',
                                    value: 'executable',
                                },
                            ],
                            default: [],
                            description: 'Check specific access permissions',
                        },
                        {
                            displayName: 'Resolve Symbolic Links',
                            name: 'resolveSymlinks',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to resolve symbolic links to their target',
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
                            displayName: 'Return Only If Exists',
                            name: 'onlyIfExists',
                            type: 'boolean',
                            default: false,
                            description: 'Only return data if the path exists (skip non-existent paths)',
                        },
                        {
                            displayName: 'Include Input Data',
                            name: 'includeInputData',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to include the original input data in the output',
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
                const filePath = this.getNodeParameter('filePath', i);
                const checkOptions = this.getNodeParameter('checkOptions', i, {});
                const outputOptions = this.getNodeParameter('outputOptions', i, {});
                // Validate file path
                if (!filePath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'File path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(filePath);
                // Check basic existence
                const exists = (0, fs_2.existsSync)(absolutePath);
                let typeMatches = true;
                let stats = null;
                let realPath = null;
                let accessPermissions = {};
                if (exists) {
                    try {
                        stats = await fs_1.promises.stat(absolutePath);
                        // Check type requirements
                        const checkType = checkOptions.checkType || 'any';
                        switch (checkType) {
                            case 'file':
                                typeMatches = stats.isFile();
                                break;
                            case 'directory':
                                typeMatches = stats.isDirectory();
                                break;
                            case 'any':
                            default:
                                typeMatches = true;
                                break;
                        }
                        // Resolve symbolic links if requested
                        if (checkOptions.resolveSymlinks && stats.isSymbolicLink()) {
                            try {
                                realPath = await fs_1.promises.realpath(absolutePath);
                            }
                            catch (error) {
                                // Keep realPath as null if resolution fails
                            }
                        }
                        // Check access permissions if requested
                        const accessChecks = checkOptions.checkAccess || [];
                        if (accessChecks.length > 0) {
                            for (const accessType of accessChecks) {
                                try {
                                    switch (accessType) {
                                        case 'readable':
                                            await fs_1.promises.access(absolutePath, fs_1.promises.constants.R_OK);
                                            accessPermissions.readable = true;
                                            break;
                                        case 'writable':
                                            await fs_1.promises.access(absolutePath, fs_1.promises.constants.W_OK);
                                            accessPermissions.writable = true;
                                            break;
                                        case 'executable':
                                            await fs_1.promises.access(absolutePath, fs_1.promises.constants.X_OK);
                                            accessPermissions.executable = true;
                                            break;
                                    }
                                }
                                catch {
                                    accessPermissions[accessType] = false;
                                }
                            }
                        }
                    }
                    catch (error) {
                        // Path exists but can't get stats (permission issue, etc.)
                        stats = null;
                    }
                }
                const finalExists = exists && typeMatches;
                // Skip if onlyIfExists is true and path doesn't exist
                if (outputOptions.onlyIfExists && !finalExists) {
                    continue;
                }
                // Prepare return data
                const result = {
                    path: absolutePath,
                    name: path.basename(absolutePath),
                    directory: path.dirname(absolutePath),
                    exists: finalExists,
                    pathExists: exists,
                    typeMatches,
                    checkType: checkOptions.checkType || 'any',
                };
                // Add detailed information if requested
                if (checkOptions.includeDetails && stats) {
                    result.details = {
                        type: stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other',
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        accessed: stats.atime,
                        isFile: stats.isFile(),
                        isDirectory: stats.isDirectory(),
                        isSymbolicLink: stats.isSymbolicLink(),
                        permissions: {
                            mode: stats.mode,
                            octal: '0' + (stats.mode & parseInt('777', 8)).toString(8),
                        },
                        owner: {
                            uid: stats.uid,
                            gid: stats.gid,
                        },
                    };
                    if (realPath) {
                        result.details.realPath = realPath;
                    }
                }
                // Add access permissions if checked
                if (Object.keys(accessPermissions).length > 0) {
                    result.access = accessPermissions;
                }
                // Include original input data if requested
                if (outputOptions.includeInputData) {
                    result.inputData = items[i].json;
                }
                returnData.push({
                    json: result,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            path: this.getNodeParameter('filePath', i, ''),
                            exists: false,
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
exports.FileExists = FileExists;
//# sourceMappingURL=FileExists.node.js.map