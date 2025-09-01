import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class CopyFile implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    private copyDirectoryRecursive;
    private formatFileSize;
}
//# sourceMappingURL=CopyFile.node.d.ts.map