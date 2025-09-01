import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class MoveFile implements INodeType {
    description: INodeTypeDescription;
    execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    private copyDirectoryRecursive;
    private formatFileSize;
}
//# sourceMappingURL=MoveFile.node.d.ts.map