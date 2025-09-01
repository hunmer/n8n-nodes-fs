import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class FileInfo implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    private formatFileSize;
    private detectMimeType;
    private isBinaryContent;
    private calculateMd5Checksum;
}
//# sourceMappingURL=FileInfo.node.d.ts.map