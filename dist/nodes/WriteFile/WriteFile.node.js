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
exports.WriteFile = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
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
class WriteFile {
    constructor() {
        this.description = {
            displayName: 'Write File',
            name: 'writeFile',
            icon: 'fa:download',
            group: ['output'],
            version: 1,
            description: 'Write content to a file',
            defaults: {
                name: 'Write File',
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
                    description: 'The path where the file should be written',
                },
                {
                    displayName: 'Content Source',
                    name: 'contentSource',
                    type: 'options',
                    options: [
                        {
                            name: 'Text Input',
                            value: 'text',
                            description: 'Enter text content directly',
                        },
                        {
                            name: 'Binary Data',
                            value: 'binary',
                            description: 'Write binary data (base64 encoded)',
                        },
                        {
                            name: 'Input Binary Field',
                            value: 'inputBinary',
                            description: 'Get binary data from previous node',
                        },
                        {
                            name: 'JSON Object',
                            value: 'json',
                            description: 'Write JSON object as formatted text',
                        },
                        {
                            name: 'From Property',
                            value: 'property',
                            description: 'Get content from input data property',
                        },
                    ],
                    default: 'text',
                    description: 'Source of the content to write',
                },
                {
                    displayName: 'Content',
                    name: 'content',
                    type: 'string',
                    displayOptions: {
                        show: {
                            contentSource: ['text'],
                        },
                    },
                    default: '',
                    placeholder: 'Enter your content here...',
                    description: 'The text content to write to the file',
                    typeOptions: {
                        rows: 4,
                    },
                },
                {
                    displayName: 'Binary Data (Base64)',
                    name: 'binaryContent',
                    type: 'string',
                    displayOptions: {
                        show: {
                            contentSource: ['binary'],
                        },
                    },
                    default: '',
                    placeholder: 'Enter base64 encoded binary data...',
                    description: 'Base64 encoded binary data to write',
                },
                {
                    displayName: 'Binary Field Name',
                    name: 'binaryFieldName',
                    type: 'string',
                    displayOptions: {
                        show: {
                            contentSource: ['inputBinary'],
                        },
                    },
                    default: 'data',
                    placeholder: 'data',
                    description: 'Name of the binary field from the previous node',
                },
                {
                    displayName: 'JSON Object',
                    name: 'jsonContent',
                    type: 'json',
                    displayOptions: {
                        show: {
                            contentSource: ['json'],
                        },
                    },
                    default: '{}',
                    description: 'JSON object to write as formatted text',
                },
                {
                    displayName: 'Property Name',
                    name: 'propertyName',
                    type: 'string',
                    displayOptions: {
                        show: {
                            contentSource: ['property'],
                        },
                    },
                    default: 'content',
                    description: 'Name of the property containing the content to write',
                },
                {
                    displayName: 'Write Mode',
                    name: 'writeMode',
                    type: 'options',
                    options: [
                        {
                            name: 'Overwrite',
                            value: 'overwrite',
                            description: 'Overwrite existing file or create new one',
                        },
                        {
                            name: 'Append',
                            value: 'append',
                            description: 'Append to existing file or create new one',
                        },
                        {
                            name: 'Create Only',
                            value: 'create',
                            description: 'Create new file only (fail if exists)',
                        },
                    ],
                    default: 'overwrite',
                    description: 'How to write the file',
                },
                {
                    displayName: 'Encoding',
                    name: 'encoding',
                    type: 'options',
                    displayOptions: {
                        show: {
                            contentSource: ['text', 'json', 'property'],
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
                    description: 'The encoding to use when writing the file',
                },
                {
                    displayName: 'Additional Options',
                    name: 'additionalOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Create Parent Directories',
                            name: 'createParentDirs',
                            type: 'boolean',
                            default: true,
                            description: 'Whether to create parent directories if they don\'t exist',
                        },
                        {
                            displayName: 'File Mode (Permissions)',
                            name: 'fileMode',
                            type: 'string',
                            default: '0644',
                            description: 'File permissions in octal notation (e.g., 0644)',
                        },
                        {
                            displayName: 'JSON Formatting',
                            name: 'jsonFormatting',
                            type: 'options',
                            displayOptions: {
                                show: {
                                    '/contentSource': ['json'],
                                },
                            },
                            options: [
                                {
                                    name: 'Pretty (Indented)',
                                    value: 'pretty',
                                },
                                {
                                    name: 'Compact',
                                    value: 'compact',
                                },
                            ],
                            default: 'pretty',
                            description: 'How to format JSON output',
                        },
                        {
                            displayName: 'Backup Existing File',
                            name: 'createBackup',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to create a backup of existing file before overwriting',
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
                const contentSource = this.getNodeParameter('contentSource', i);
                const writeMode = this.getNodeParameter('writeMode', i);
                const encoding = this.getNodeParameter('encoding', i, 'utf8');
                const additionalOptions = this.getNodeParameter('additionalOptions', i, {});
                const createParentDirs = additionalOptions.createParentDirs !== false;
                const fileMode = additionalOptions.fileMode || '0644';
                const jsonFormatting = additionalOptions.jsonFormatting || 'pretty';
                const createBackup = additionalOptions.createBackup || false;
                // Validate file path
                if (!filePath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'File path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(filePath);
                // Check if file exists for different write modes
                const fileExists = (0, fs_2.existsSync)(absolutePath);
                if (writeMode === 'create' && fileExists) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `File already exists and write mode is 'create only': ${absolutePath}`, { itemIndex: i });
                }
                // Create parent directories if needed
                if (createParentDirs) {
                    const parentDir = path.dirname(absolutePath);
                    if (!(0, fs_2.existsSync)(parentDir)) {
                        (0, fs_2.mkdirSync)(parentDir, { recursive: true });
                    }
                }
                // Create backup if requested and file exists
                if (createBackup && fileExists) {
                    const backupPath = `${absolutePath}.backup.${Date.now()}`;
                    await fs_1.promises.copyFile(absolutePath, backupPath);
                }
                // Get content based on source
                let content;
                switch (contentSource) {
                    case 'text':
                        content = this.getNodeParameter('content', i);
                        break;
                    case 'binary':
                        const binaryContent = this.getNodeParameter('binaryContent', i);
                        content = Buffer.from(binaryContent, 'base64');
                        break;
                    case 'inputBinary':
                        const binaryFieldName = this.getNodeParameter('binaryFieldName', i);
                        const binaryData = this.helpers.assertBinaryData(i, binaryFieldName);
                        content = await this.helpers.getBinaryDataBuffer(i, binaryFieldName);
                        break;
                    case 'json':
                        const jsonContent = this.getNodeParameter('jsonContent', i);
                        content = jsonFormatting === 'pretty'
                            ? JSON.stringify(jsonContent, null, 2)
                            : JSON.stringify(jsonContent);
                        break;
                    case 'property':
                        const propertyName = this.getNodeParameter('propertyName', i);
                        const propertyValue = items[i].json[propertyName];
                        if (propertyValue === undefined) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Property '${propertyName}' not found in input data`, { itemIndex: i });
                        }
                        content = typeof propertyValue === 'string'
                            ? propertyValue
                            : JSON.stringify(propertyValue, null, 2);
                        break;
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid content source: ${contentSource}`, { itemIndex: i });
                }
                // Write file based on mode
                const writeOptions = {
                    encoding: (contentSource === 'binary' || contentSource === 'inputBinary') ? undefined : encoding,
                    mode: parseInt(fileMode, 8),
                };
                if (writeMode === 'append') {
                    writeOptions.flag = 'a';
                }
                await fs_1.promises.writeFile(absolutePath, content, writeOptions);
                // Get file stats after writing
                const stats = await fs_1.promises.stat(absolutePath);
                // Prepare return data
                const returnItem = {
                    success: true,
                    filePath: absolutePath,
                    fileName: path.basename(absolutePath),
                    fileExtension: path.extname(absolutePath),
                    writeMode,
                    contentSource,
                    bytesWritten: stats.size,
                    sizeHuman: formatFileSize(stats.size),
                    created: stats.birthtime,
                    modified: stats.mtime,
                };
                if (contentSource === 'text' || contentSource === 'property') {
                    returnItem.encoding = encoding;
                }
                if (contentSource === 'inputBinary') {
                    returnItem.binaryFieldName = this.getNodeParameter('binaryFieldName', i);
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
exports.WriteFile = WriteFile;
//# sourceMappingURL=WriteFile.node.js.map