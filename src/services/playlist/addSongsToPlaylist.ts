import { BatchWriteCommand, BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;

export const addSongsToPlaylist = async (playlistId: string, songs: { id: string, artistId: string }[]) => {
    if (!songs?.length) return;
    if (songs.length > 100) throw new Error("Too many songs");

    const BATCH_SIZE = 25;
    const batchPromises = [];

    for (let i = 0; i < songs.length; i += BATCH_SIZE) {
        const chunk = songs.slice(i, i + BATCH_SIZE);

        const putRequests = chunk.map((song) => ({
            PutRequest: {
                Item: {
                    PK: `PLAYLIST#${playlistId}`,
                    SK: `SONG#${song.id}`,
                    songId: song.id,
                    songArtistId: song.artistId,
                    addedAt: new Date().toISOString(),
                },
            },
        }));

        batchPromises.push(executeBatchWrite(putRequests));
    }

    await Promise.all(batchPromises);
};

async function executeBatchWrite(items: any[], attempt = 0) {
    const MAX_RETRIES = 3;

    const input: BatchWriteCommandInput = {
        RequestItems: {
            [musicTable]: items,
        },
    };

    try {
        const response = await docClient.send(new BatchWriteCommand(input));
        const unprocessed = response.UnprocessedItems?.[musicTable];

        if (unprocessed && unprocessed.length > 0) {
            if (attempt >= MAX_RETRIES) {
                console.error(`Failed to add ${unprocessed.length} items after ${MAX_RETRIES} attempts.`);
                return;
            }

            const delay = Math.pow(2, attempt) * 50;
            await new Promise((res) => setTimeout(res, delay));

            return executeBatchWrite(unprocessed, attempt + 1);
        }
    } catch (error) {
        console.error("Error during BatchWrite execution:", error);
        throw error;
    }
}