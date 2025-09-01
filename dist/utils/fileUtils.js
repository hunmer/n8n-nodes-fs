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
exports.passesFileFilters = exports.copyDirectoryRecursive = exports.sortFiles = exports.getFilesRecursively = exports.calculateMd5Checksum = exports.isBinaryContent = exports.detectMimeType = exports.formatFileSize = void 0;
const fs_1 = require("fs");
const crypto_1 = require("crypto");
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
exports.formatFileSize = formatFileSize;
// Helper function to detect MIME type
function detectMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.zip': 'application/zip',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeTypes[extension] || 'application/octet-stream';
}
exports.detectMimeType = detectMimeType;
// Helper function to check if content is binary
function isBinaryContent(buffer) {
    for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        const byte = buffer[i];
        if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
            return true;
        }
    }
    return false;
}
exports.isBinaryContent = isBinaryContent;
// Helper function to calculate MD5 checksum
async function calculateMd5Checksum(filePath) {
    const hash = (0, crypto_1.createHash)('md5');
    const stream = await fs_1.promises.readFile(filePath);
    hash.update(stream);
    return hash.digest('hex');
}
exports.calculateMd5Checksum = calculateMd5Checksum;
// Helper function to get files recursively
async function getFilesRecursively(dirPath, maxDepth = 10, currentDepth = 0, patterns = [], excludePatterns = []) {
    const results = [];
    if (currentDepth >= maxDepth) {
        return results;
    }
    try {
        const items = await fs_1.promises.readdir(dirPath);
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = await fs_1.promises.stat(fullPath);
            const fileInfo = {
                path: fullPath,
                name: item,
                isDirectory: stats.isDirectory(),
                stats
            };
            // Apply exclude patterns
            const shouldExclude = excludePatterns.some(pattern => {
                const regex = new RegExp(pattern);
                return regex.test(item) || regex.test(fullPath);
            });
            if (shouldExclude) {
                continue;
            }
            // Apply include patterns (if any)
            if (patterns.length > 0) {
                const shouldInclude = patterns.some(pattern => {
                    const regex = new RegExp(pattern);
                    return regex.test(item) || regex.test(fullPath);
                });
                if (!shouldInclude && !stats.isDirectory()) {
                    continue;
                }
            }
            results.push(fileInfo);
            // Recurse into directories
            if (stats.isDirectory()) {
                const subResults = await getFilesRecursively(fullPath, maxDepth, currentDepth + 1, patterns, excludePatterns);
                results.push(...subResults);
            }
        }
    }
    catch (error) {
        // Skip directories we can't read
    }
    return results;
}
exports.getFilesRecursively = getFilesRecursively;
// Helper function to sort files
function sortFiles(files, sortBy, sortOrder) {
    return files.sort((a, b) => {
        let compareValue = 0;
        switch (sortBy) {
            case 'name':
                compareValue = a.name.localeCompare(b.name);
                break;
            case 'size':
                compareValue = a.stats.size - b.stats.size;
                break;
            case 'modified':
                compareValue = new Date(a.stats.mtime).getTime() - new Date(b.stats.mtime).getTime();
                break;
            case 'created':
                compareValue = new Date(a.stats.ctime).getTime() - new Date(b.stats.ctime).getTime();
                break;
            case 'type':
                // Directories first, then by extension
                if (a.isDirectory && !b.isDirectory) {
                    compareValue = -1;
                }
                else if (!a.isDirectory && b.isDirectory) {
                    compareValue = 1;
                }
                else {
                    const aExt = path.extname(a.name);
                    const bExt = path.extname(b.name);
                    compareValue = aExt.localeCompare(bExt);
                }
                break;
            default:
                compareValue = a.name.localeCompare(b.name);
        }
        return sortOrder === 'desc' ? -compareValue : compareValue;
    });
}
exports.sortFiles = sortFiles;
// Helper function to copy directory recursively
async function copyDirectoryRecursive(source, destination, preserveTimestamps = false) {
    let totalBytes = 0;
    // Create destination directory
    await fs_1.promises.mkdir(destination, { recursive: true });
    const items = await fs_1.promises.readdir(source);
    for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        const stats = await fs_1.promises.stat(sourcePath);
        if (stats.isDirectory()) {
            totalBytes += await copyDirectoryRecursive(sourcePath, destPath, preserveTimestamps);
        }
        else {
            await fs_1.promises.copyFile(sourcePath, destPath);
            totalBytes += stats.size;
            // Preserve timestamps if requested
            if (preserveTimestamps) {
                await fs_1.promises.utimes(destPath, stats.atime, stats.mtime);
            }
        }
    }
    return totalBytes;
}
exports.copyDirectoryRecursive = copyDirectoryRecursive;
// Helper function to check if filters pass
function passesFileFilters(filePath, fileName, stats, filters) {
    // Name pattern filter
    if (filters.namePattern) {
        const regex = new RegExp(filters.namePattern, 'i');
        if (!regex.test(fileName)) {
            return false;
        }
    }
    // Extension filter
    if (filters.extensions && filters.extensions.length > 0) {
        const ext = path.extname(fileName).toLowerCase().substring(1);
        if (!filters.extensions.includes(ext)) {
            return false;
        }
    }
    // Size filters
    if (filters.minSize !== undefined && stats.size < filters.minSize) {
        return false;
    }
    if (filters.maxSize !== undefined && stats.size > filters.maxSize) {
        return false;
    }
    // Date filters
    const fileDate = new Date(stats.mtime);
    if (filters.modifiedAfter) {
        const afterDate = new Date(filters.modifiedAfter);
        if (fileDate <= afterDate) {
            return false;
        }
    }
    if (filters.modifiedBefore) {
        const beforeDate = new Date(filters.modifiedBefore);
        if (fileDate >= beforeDate) {
            return false;
        }
    }
    // Type filter
    if (filters.fileType) {
        if (filters.fileType === 'file' && stats.isDirectory()) {
            return false;
        }
        if (filters.fileType === 'directory' && !stats.isDirectory()) {
            return false;
        }
    }
    return true;
}
exports.passesFileFilters = passesFileFilters;
//# sourceMappingURL=fileUtils.js.map