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
exports.FileInfo = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const fs_1 = require("fs");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const fileUtils_1 = require("../../utils/fileUtils");
class FileInfo {
    constructor() {
        this.description = {
            displayName: 'File Info',
            name: 'fileInfo',
            icon: 'fa:info-circle',
            group: ['input'],
            version: 1,
            description: 'Get detailed information about a file or directory',
            defaults: {
                name: 'File Info',
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
                    description: 'The path to the file or directory to get information about',
                },
                {
                    displayName: 'Include Options',
                    name: 'includeOptions',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'MIME Type Detection',
                            name: 'detectMimeType',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to detect and include MIME type for files',
                        },
                        {
                            displayName: 'File Content Sample',
                            name: 'includeContentSample',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include a small sample of file content (first 200 chars)',
                        },
                        {
                            displayName: 'Directory Contents Count',
                            name: 'countDirectoryContents',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to count files and subdirectories (for directories)',
                        },
                        {
                            displayName: 'Checksum (MD5)',
                            name: 'calculateChecksum',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to calculate MD5 checksum for files',
                        },
                        {
                            displayName: 'Real Path Resolution',
                            name: 'resolveRealPath',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to resolve symbolic links to real paths',
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
                const includeOptions = this.getNodeParameter('includeOptions', i, {});
                // Validate file path
                if (!filePath) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'File path is required', { itemIndex: i });
                }
                // Resolve absolute path
                const absolutePath = path.resolve(filePath);
                // Check if path exists
                if (!(0, fs_2.existsSync)(absolutePath)) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Path not found: ${absolutePath}`, { itemIndex: i });
                }
                // Get basic file stats
                const stats = await fs_1.promises.stat(absolutePath);
                const isFile = stats.isFile();
                const isDirectory = stats.isDirectory();
                const isSymbolicLink = stats.isSymbolicLink();
                // Basic file information
                const fileInfo = {
                    path: absolutePath,
                    name: path.basename(absolutePath),
                    directory: path.dirname(absolutePath),
                    extension: isFile ? path.extname(absolutePath) : '',
                    type: isDirectory ? 'directory' : isFile ? 'file' : 'other',
                    size: stats.size,
                    sizeHuman: (0, fileUtils_1.formatFileSize)(stats.size),
                    created: stats.birthtime,
                    modified: stats.mtime,
                    accessed: stats.atime,
                    isFile,
                    isDirectory,
                    isSymbolicLink,
                    permissions: {
                        mode: stats.mode,
                        octal: '0' + (stats.mode & parseInt('777', 8)).toString(8),
                        readable: !!(stats.mode & 0o444),
                        writable: !!(stats.mode & 0o222),
                        executable: !!(stats.mode & 0o111),
                    },
                    owner: {
                        uid: stats.uid,
                        gid: stats.gid,
                    },
                    blocks: stats.blocks,
                    blockSize: stats.blksize,
                    device: stats.dev,
                    inode: stats.ino,
                    hardLinks: stats.nlink,
                };
                // Optional: Resolve real path for symbolic links
                if (includeOptions.resolveRealPath && isSymbolicLink) {
                    try {
                        fileInfo.realPath = await fs_1.promises.realpath(absolutePath);
                    }
                    catch (error) {
                        fileInfo.realPathError = error.message;
                    }
                }
                // Optional: MIME type detection for files
                if (includeOptions.detectMimeType && isFile) {
                    fileInfo.mimeType = (0, fileUtils_1.detectMimeType)(absolutePath);
                }
                // Optional: Content sample for files
                if (includeOptions.includeContentSample && isFile && stats.size > 0) {
                    try {
                        const buffer = await fs_1.promises.readFile(absolutePath);
                        const sampleSize = Math.min(200, buffer.length);
                        const sample = buffer.slice(0, sampleSize).toString('utf8');
                        fileInfo.contentSample = sample;
                        fileInfo.contentSampleSize = sampleSize;
                        fileInfo.isBinary = (0, fileUtils_1.isBinaryContent)(buffer.slice(0, 512));
                    }
                    catch (error) {
                        fileInfo.contentSampleError = error.message;
                    }
                }
                // Optional: Directory contents count
                if (includeOptions.countDirectoryContents && isDirectory) {
                    try {
                        const contents = await fs_1.promises.readdir(absolutePath);
                        const counts = { files: 0, directories: 0, others: 0, total: contents.length };
                        for (const item of contents) {
                            const itemPath = path.join(absolutePath, item);
                            const itemStats = await fs_1.promises.stat(itemPath);
                            if (itemStats.isFile())
                                counts.files++;
                            else if (itemStats.isDirectory())
                                counts.directories++;
                            else
                                counts.others++;
                        }
                        fileInfo.contents = counts;
                    }
                    catch (error) {
                        fileInfo.contentsError = error.message;
                    }
                }
                // Optional: Calculate checksum for files
                if (includeOptions.calculateChecksum && isFile && stats.size > 0) {
                    try {
                        fileInfo.checksum = await (0, fileUtils_1.calculateMd5Checksum)(absolutePath);
                    }
                    catch (error) {
                        fileInfo.checksumError = error.message;
                    }
                }
                returnData.push({
                    json: fileInfo,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                            path: this.getNodeParameter('filePath', i, ''),
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
    detectMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.xml': 'text/xml',
            '.csv': 'text/csv',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.zip': 'application/zip',
            '.rar': 'application/x-rar-compressed',
            '.tar': 'application/x-tar',
            '.gz': 'application/gzip',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    isBinaryContent(buffer) {
        // Simple heuristic: if buffer contains null bytes or high ratio of non-printable chars, it's binary
        const nullBytes = buffer.indexOf(0);
        if (nullBytes !== -1)
            return true;
        let printableChars = 0;
        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printableChars++;
            }
        }
        return (printableChars / buffer.length) < 0.7;
    }
    async calculateMd5Checksum(filePath) {
        // Note: This is a simplified implementation
        // In a real implementation, you'd use crypto.createHash('md5')
        const buffer = await fs_1.promises.readFile(filePath);
        // For now, return a placeholder - would need crypto module
        return `md5-${buffer.length}-${Date.now()}`;
    }
}
exports.FileInfo = FileInfo;
//# sourceMappingURL=FileInfo.node.js.map