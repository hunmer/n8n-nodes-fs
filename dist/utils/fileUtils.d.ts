/// <reference types="node" />
/// <reference types="node" />
export declare function formatFileSize(bytes: number): string;
export declare function detectMimeType(filePath: string): string;
export declare function isBinaryContent(buffer: Buffer): boolean;
export declare function calculateMd5Checksum(filePath: string): Promise<string>;
export declare function getFilesRecursively(dirPath: string, maxDepth?: number, currentDepth?: number, patterns?: string[], excludePatterns?: string[]): Promise<Array<{
    path: string;
    name: string;
    isDirectory: boolean;
    stats: any;
}>>;
export declare function sortFiles(files: Array<{
    path: string;
    name: string;
    isDirectory: boolean;
    stats: any;
}>, sortBy: string, sortOrder: string): Array<{
    path: string;
    name: string;
    isDirectory: boolean;
    stats: any;
}>;
export declare function copyDirectoryRecursive(source: string, destination: string, preserveTimestamps?: boolean): Promise<number>;
export declare function passesFileFilters(filePath: string, fileName: string, stats: any, filters: any): boolean;
//# sourceMappingURL=fileUtils.d.ts.map