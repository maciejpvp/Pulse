import {
    DynamoDBClient,
    BatchWriteItemCommand,
    WriteRequest
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

export type BatchOp =
    | { type: 'PUT', table: string, item: Record<string, any> }
    | { type: 'DELETE', table: string, key: Record<string, any> };

export async function universalBatchWrite(
    operations: BatchOp[],
    maxRetries = 3
) {
    const requestsByTable: Record<string, WriteRequest[]> = {};
    operations.forEach(op => {
        if (!requestsByTable[op.table]) requestsByTable[op.table] = [];
        const writeReq: WriteRequest = op.type === 'PUT'
            ? { PutRequest: { Item: marshall(op.item, { removeUndefinedValues: true }) } }
            : { DeleteRequest: { Key: marshall(op.key) } };
        requestsByTable[op.table].push(writeReq);
    });

    const allBatches: Record<string, WriteRequest[]>[] = [];
    let currentBatch: Record<string, WriteRequest[]> = {};
    let currentCount = 0;

    for (const table in requestsByTable) {
        for (const req of requestsByTable[table]) {
            if (currentCount === 25) {
                allBatches.push(currentBatch);
                currentBatch = {};
                currentCount = 0;
            }
            if (!currentBatch[table]) currentBatch[table] = [];
            currentBatch[table].push(req);
            currentCount++;
        }
    }
    if (currentCount > 0) allBatches.push(currentBatch);

    const executeWithRetry = async (
        requestItems: Record<string, WriteRequest[]>,
        attempt = 0
    ): Promise<void> => {
        const command = new BatchWriteItemCommand({ RequestItems: requestItems });
        const response = await client.send(command);

        const unprocessed = response.UnprocessedItems;
        const hasUnprocessed = unprocessed && Object.keys(unprocessed).length > 0;

        if (hasUnprocessed) {
            if (attempt >= maxRetries) {
                console.error("BatchWrite failed: Max retries reached. Unprocessed items remaining.");
                throw new Error(`Failed to process ${Object.keys(unprocessed).length} items after ${maxRetries} retries.`);
            }

            const baseDelay = Math.pow(2, attempt) * 50;
            const jitterDelay = Math.random() * baseDelay;

            await new Promise(res => setTimeout(res, jitterDelay));
            return executeWithRetry(unprocessed, attempt + 1);
        }
    };

    return Promise.all(allBatches.map(batch => executeWithRetry(batch)));
}