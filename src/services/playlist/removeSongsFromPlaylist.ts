import { BatchWriteCommand, BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const removeSongsFromPlaylist = async (playlistId: string, songsIds: string[]) => {
    if (!songsIds?.length) return;
    if (songsIds.length > 100) throw new Error("Too many songs");

    const BATCH_SIZE = 25;
    const batchPromises = [];

    for (let i = 0; i < songsIds.length; i += BATCH_SIZE) {
        const chunk = songsIds.slice(i, i + BATCH_SIZE);

        const deleteRequests = chunk.map((songId) => ({
            DeleteRequest: {
                Key: {
                    PK: `PLAYLIST#${playlistId}`,
                    SK: `SONG#${songId}`,
                },
            },
        }));

        batchPromises.push(executeBatchWrite(deleteRequests));
    }

    await Promise.all(batchPromises);
};

async function executeBatchWrite(items: any[], attempt = 0) {
    const MAX_RETRIES = 3; // Safety limit

    const input: BatchWriteCommandInput = {
        RequestItems: {
            [musicTable]: items,
        },
    };

    try {
        const { UnprocessedItems } = await docClient.send(new BatchWriteCommand(input));

        if (UnprocessedItems && UnprocessedItems[musicTable]?.length > 0) {
            if (attempt >= MAX_RETRIES) {
                console.error(`Failed to process ${UnprocessedItems[musicTable].length} items after ${MAX_RETRIES} attempts.`);
                return;
            }

            const retryItems = UnprocessedItems[musicTable];
            const delay = Math.pow(2, attempt) * 50;

            await new Promise((resolve) => setTimeout(resolve, delay));
            return executeBatchWrite(retryItems, attempt + 1);
        }
    } catch (error) {
        console.error("Batch delete failed due to a network or permission error:", error);
        throw error;
    }
}