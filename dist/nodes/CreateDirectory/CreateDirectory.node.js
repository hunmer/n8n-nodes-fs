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
exports.CreateDirectory = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
class CreateDirectory {
    constructor() {
        this.description = {
            displayName: 'Create Directory',
            name: 'createDirectory',
            icon: 'fa:folder-plus',
            group: ['output'],
            version: 1,
            description: 'Create directories with optional nested structure',
            defaults: {
                name: 'Create Directory',
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
                    placeholder: '/path/to/new/directory',
                    description: 'The path of the directory to create',
                },
                {
                    displayName: 'Creation Options',
                    name: 'creationOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Recursive Creation',
                            name: 'recursive',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to create parent directories if they don\'t exist',
                        },
                        {
                            displayName: 'Directory Mode (Permissions)',
                            name: 'directoryMode',
                            type: 'string',
                            default: '0755',
                            description: 'Directory permissions in octal notation (e.g., 0755)',
                        },
                        {
                            displayName: 'Skip if Exists',
                            name: 'skipIfExists',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to skip without error if directory already exists',
                        },
                        {
                            displayName: 'Create Parent Structure Only',
                            name: 'parentsOnly',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to create only parent directories, not the final directory',
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
                const creationOptions = this.getNodeParameter('creationOptions', i, {});
                const recursive = creationOptions.recursive !== false;
                const directoryMode = creationOptions.directoryMode || '0755';
                const skipIfExists = creationOptions.skipIfExists !== false;
                const parentsOnly = creationOptions.parentsOnly || false;
                // Validate directory path
                if (!directoryPath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Directory path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(directoryPath);
                const targetPath = parentsOnly ? path.dirname(absolutePath) : absolutePath;
                // Check if directory already exists
                const alreadyExists = (0, fs_2.existsSync)(targetPath);
                if (alreadyExists) {
                    if (skipIfExists) {
                        returnData.push({
                            json: {
                                success: true,
                                created: false,
                                skipped: true,
                                message: 'Directory already exists, skipped as requested',
                                path: targetPath,
                                name: path.basename(targetPath),
                            },
                            pairedItem: { item: i },
                        });
                        continue;
                    }
                    else {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Directory already exists: ${targetPath}`, { itemIndex: i });
                    }
                }
                // Create directory
                const creationStartTime = Date.now();
                const mkdirOptions = {
                    mode: parseInt(directoryMode, 8),
                };
                if (recursive) {
                    mkdirOptions.recursive = true;
                }
                await fs_1.promises.mkdir(targetPath, mkdirOptions);
                const creationEndTime = Date.now();
                // Get directory stats after creation
                const stats = await fs_1.promises.stat(targetPath);
                // Prepare return data
                const returnItem = {
                    success: true,
                    created: true,
                    path: targetPath,
                    name: path.basename(targetPath),
                    parentDirectory: path.dirname(targetPath),
                    creationTime: creationEndTime - creationStartTime,
                    createdAt: new Date().toISOString(),
                    permissions: {
                        mode: stats.mode,
                        octal: '0' + (stats.mode & parseInt('777', 8)).toString(8),
                    },
                    owner: {
                        uid: stats.uid,
                        gid: stats.gid,
                    },
                    recursive,
                    parentsOnly,
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
                            created: false,
                            error: error.message,
                            path: this.getNodeParameter('directoryPath', i, ''),
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
exports.CreateDirectory = CreateDirectory;
//# sourceMappingURL=CreateDirectory.node.js.map