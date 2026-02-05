import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const musicTable = process.env.musicTable!;



export const handler = async (event: any) => {
    if (!event.Records) {
        console.warn("No records found in event");
        return { batchItemFailures: [] };
    }

    const batchItemFailures: { itemIdentifier: string }[] = [];

    const promises = event.Records.map(async (record: any) => {
        try {
            const body = JSON.parse(record.body);
            const { userId, artistId, songId, contextType, contextId } = body;

            if (!userId) throw new Error("userId is required");
            if (!artistId || !songId) throw new Error("artistId and songId are required");
            if (!contextType || !contextId) throw new Error("contextType and contextId are required");

            const now = Math.floor(Date.now() / 1000);
            const ttl = now + 7 * 24 * 60 * 60;

            await docClient.send(new PutCommand({
                TableName: musicTable,
                Item: {
                    PK: `USER#${userId}`,
                    SK: `LASTLISTENED#${contextType}#${contextId}`,
                    contextType, // ALBUM | SONG | PLAYLIST | ARTIST
                    contextId,
                    artistId,
                    lastListenedAt: now,
                    ttl,
                    GSI1PK: `USER#${userId}`,
                    GSI1SK: `${now}#${contextType}#${contextId}`,
                }
            }));

            // update cloudstate

            await docClient.send(new UpdateCommand({
                TableName: musicTable,
                Key: {
                    PK: `USER#${userId}`,
                    SK: `CLOUDSTATE`,
                },
                UpdateExpression: "SET #trackId = :trackId, #trackArtistId = :trackArtistId",
                ExpressionAttributeNames: {
                    "#trackId": "trackId",
                    "#trackArtistId": "trackArtistId"
                },
                ExpressionAttributeValues: {
                    ":trackId": songId,
                    ":trackArtistId": artistId,
                },
            }));
        } catch (error) {
            console.error(`Failed to process record ${record.messageId}:`, error);
            batchItemFailures.push({ itemIdentifier: record.messageId });
        }
    });

    await Promise.all(promises);

    return {
        batchItemFailures,
    };
};
