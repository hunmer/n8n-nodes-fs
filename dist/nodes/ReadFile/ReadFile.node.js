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
exports.ReadFile = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const fs_2 = require("fs");
const path = __importStar(require("path"));
// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
class ReadFile {
    constructor() {
        this.description = {
            displayName: 'Read File',
            name: 'readFile',
            icon: 'fa:file',
            group: ['input'],
            version: 1,
            description: 'Read content from a file',
            defaults: {
                name: 'Read File',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                {
                    displayName: 'File Path',
                    name: 'filePath',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: '/path/to/your/file.txt',
                    description: 'The path to the file to read',
                },
                {
                    displayName: 'Read Mode',
                    name: 'readMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Text',
                            value: 'text',
                            description: 'Read file as text content',
                        },
                        {
                            name: 'Binary',
                            value: 'binary',
                            description: 'Read file as binary data (base64 encoded)',
                        },
                        {
                            name: 'JSON',
                            value: 'json',
                            description: 'Read and parse file as JSON',
                        },
                    ],
                    default: 'text',
                    description: 'How to read the file content',
                },
                {
                    displayName: 'Encoding',
                    name: 'encoding',
                    type: 'options',
                    displayOptions: {
                        show: {
                            readMode: ['text'],
                        },
                    },
                    options: [
                        {
                            name: 'UTF-8',
                            value: 'utf8',
                        },
                        {
                            name: 'ASCII',
                            value: 'ascii',
                        },
                        {
                            name: 'UTF-16 LE',
                            value: 'utf16le',
                        },
                        {
                            name: 'Base64',
                            value: 'base64',
                        },
                        {
                            name: 'Hex',
                            value: 'hex',
                        },
                    ],
                    default: 'utf8',
                    description: 'The encoding to use when reading the file',
                },
                {
                    displayName: 'Additional Options',
                    name: 'additionalOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Include File Stats',
                            name: 'includeStats',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include file statistics (size, dates, etc.)',
                        },
                        {
                            displayName: 'Property Name',
                            name: 'propertyName',
                            type: 'string',
                            default: 'content',
                            description: 'Name of the property to store the file content',
                        },
                        {
                            displayName: 'Include File Object',
                            name: 'includeFileObject',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include the complete file object with metadata',
                        },
                        {
                            displayName: 'File Object Property Name',
                            name: 'fileObjectPropertyName',
                            type: 'string',
                            default: 'fileObject',
                            displayOptions: {
                                show: {
                                    includeFileObject: [true],
                                },
                            },
                            description: 'Name of the property to store the complete file object',
                        },
                        {
                            displayName: 'Max File Size (MB)',
                            name: 'maxFileSize',
                            type: 'number',
                            default: 10,
                            description: 'Maximum file size in megabytes (0 = no limit)',
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
                const readMode = this.getNodeParameter('readMode', i);
                const encoding = this.getNodeParameter('encoding', i, 'utf8');
                const additionalOptions = this.getNodeParameter('additionalOptions', i, {});
                const propertyName = additionalOptions.propertyName || 'content';
                const includeStats = additionalOptions.includeStats || false;
                const includeFileObject = additionalOptions.includeFileObject || false;
                const fileObjectPropertyName = additionalOptions.fileObjectPropertyName || 'fileObject';
                const maxFileSize = (additionalOptions.maxFileSize || 0) * 1024 * 1024; // Convert MB to bytes
                // Validate file path
                if (!filePath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'File path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(filePath);
                // Check if file exists
                if (!(0, fs_2.existsSync)(absolutePath)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `File not found: ${absolutePath}`, { itemIndex: i });
                }
                // Get file stats
                const stats = await (0, promises_1.stat)(absolutePath);
                // Check if it's a file (not directory)
                if (!stats.isFile()) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Path is not a file: ${absolutePath}`, { itemIndex: i });
                }
                // Check file size limit
                if (maxFileSize > 0 && stats.size > maxFileSize) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds limit (${additionalOptions.maxFileSize}MB)`, { itemIndex: i });
                }
                let content;
                // Read file based on mode
                switch (readMode) {
                    case 'text':
                        content = await fs_1.promises.readFile(absolutePath, encoding);
                        break;
                    case 'binary':
                        const buffer = await fs_1.promises.readFile(absolutePath);
                        content = buffer.toString('base64');
                        break;
                    case 'json':
                        const jsonContent = await fs_1.promises.readFile(absolutePath, 'utf8');
                        try {
                            content = JSON.parse(jsonContent);
                        }
                        catch (parseError) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Failed to parse JSON: ${parseError.message}`, { itemIndex: i });
                        }
                        break;
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid read mode: ${readMode}`, { itemIndex: i });
                }
                // Prepare return data
                const returnItem = {
                    [propertyName]: content,
                    filePath: absolutePath,
                    fileName: path.basename(absolutePath),
                    fileExtension: path.extname(absolutePath),
                    readMode,
                };
                // Include file stats if requested
                if (includeStats) {
                    returnItem.fileStats = {
                        size: stats.size,
                        sizeHuman: formatFileSize(stats.size),
                        created: stats.birthtime,
                        modified: stats.mtime,
                        accessed: stats.atime,
                        isFile: stats.isFile(),
                        isDirectory: stats.isDirectory(),
                        mode: stats.mode,
                        uid: stats.uid,
                        gid: stats.gid,
                    };
                }
                // Include complete file object if requested
                if (includeFileObject) {
                    returnItem[fileObjectPropertyName] = {
                        name: path.basename(absolutePath),
                        path: absolutePath,
                        relativePath: path.relative(process.cwd(), absolutePath),
                        type: 'file',
                        extension: path.extname(absolutePath),
                        content: content,
                        size: stats.size,
                        sizeHuman: formatFileSize(stats.size),
                        created: stats.birthtime,
                        modified: stats.mtime,
                        accessed: stats.atime,
                        isFile: true,
                        isDirectory: false,
                        permissions: stats.mode,
                        readMode: readMode,
                        encoding: readMode === 'text' ? encoding : undefined,
                    };
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
                            error: error.message,
                            filePath: this.getNodeParameter('filePath', i, ''),
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
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
exports.ReadFile = ReadFile;
//# sourceMappingURL=ReadFile.node.js.map