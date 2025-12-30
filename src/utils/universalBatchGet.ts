import {
    DynamoDBClient,
    BatchGetItemCommand,
    BatchGetItemCommandInput
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

interface GetOp {
    table: string;
    key: Record<string, any>;
}

/**
 * Universal DynamoDB Batch Get
 * Features: Auto-chunking (100), Auto-unmarshalling, Exponential Backoff + Jitter.
 */
export async function universalBatchGet(
    operations: GetOp[],
    maxRetries = 3
): Promise<any[]> {
    if (operations.length === 0) return [];

    // 1. Group operations by table
    const tableGroups: Record<string, any[]> = {};
    operations.forEach(op => {
        if (!tableGroups[op.table]) tableGroups[op.table] = [];
        tableGroups[op.table].push(marshall(op.key));
    });

    // 2. Create chunks of 100 total keys (across all tables)
    const batches: BatchGetItemCommandInput["RequestItems"][] = [];
    let currentBatch: BatchGetItemCommandInput["RequestItems"] = {};
    let currentCount = 0;

    for (const table in tableGroups) {
        for (const key of tableGroups[table]) {
            if (currentCount === 100) {
                batches.push(currentBatch);
                currentBatch = {};
                currentCount = 0;
            }
            if (!currentBatch[table]) currentBatch[table] = { Keys: [] };
            currentBatch[table].Keys!.push(key);
            currentCount++;
        }
    }
    if (currentCount > 0) batches.push(currentBatch);

    // 3. Execution function with retry logic
    const results: any[] = [];

    const executeBatch = async (requestItems: BatchGetItemCommandInput["RequestItems"], attempt = 0) => {
        const command = new BatchGetItemCommand({ RequestItems: requestItems });
        const response = await client.send(command);

        // Collect data
        if (response.Responses) {
            for (const table in response.Responses) {
                const unmarshalled = response.Responses[table].map(item => unmarshall(item));
                results.push(...unmarshalled);
            }
        }

        // Handle UnprocessedKeys (Throttling or 16MB limit reached)
        const unprocessed = response.UnprocessedKeys;
        if (unprocessed && Object.keys(unprocessed).length > 0) {
            if (attempt >= maxRetries) {
                throw new Error(`BatchGet failed: Max retries reached with ${Object.keys(unprocessed).length} keys remaining.`);
            }

            // Exponential backoff with Jitter
            const baseDelay = Math.pow(2, attempt) * 50;
            const jitterDelay = Math.random() * baseDelay;

            await new Promise(res => setTimeout(res, jitterDelay));
            return executeBatch(unprocessed, attempt + 1);
        }
    };

    // Run all chunks in parallel
    await Promise.all(batches.map(batch => executeBatch(batch)));

    return results;
}