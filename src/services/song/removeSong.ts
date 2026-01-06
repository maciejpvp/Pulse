import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BatchOp, universalBatchWrite } from "../../utils/universalBatchWrite";

type Props = {
    songId: string;
    artistId: string;
}

const musicTable = process.env.musicTable!;
const songsBucket = process.env.songsBucket!;
const s3Client = new S3Client({});

export const removeSong = async ({ songId, artistId }: Props) => {
    try {
        const songItem = await docClient.send(new GetCommand({
            TableName: musicTable,
            Key: {
                PK: `ARTIST#${artistId}`,
                SK: `SONG#${songId}`,
            },
        }));

        const item = songItem.Item;
        if (!item) return false;

        const songsRelatedItems = await fetchAllSongRelatedItems(songId);

        const operations: BatchOp[] = [
            {
                type: "DELETE",
                table: musicTable,
                key: {
                    PK: `ARTIST#${artistId}`,
                    SK: `SONG#${songId}`,
                }
            }
        ];

        const filteredItems = songsRelatedItems.filter(related =>
            !(related.PK === `ARTIST#${artistId}` && related.SK === `SONG#${songId}`)
        );

        operations.push(...filteredItems.map(related => ({
            type: "DELETE" as const,
            table: musicTable,
            key: {
                PK: related.PK,
                SK: related.SK,
            }
        })));

        await universalBatchWrite(operations);

        if (item.fileKey) {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: songsBucket,
                Key: item.fileKey
            })).catch(err => console.error("S3 Deletion Failed (Orphan File):", err));
        }

        return true;
    } catch (err: unknown) {
        console.error("ERROR in removeSong:", err);
        return false;
    }
};

async function fetchAllSongRelatedItems(songId: string) {
    let allItems: any[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
        const result = await docClient.send(new QueryCommand({
            TableName: musicTable,
            IndexName: "GSI2",
            KeyConditionExpression: "GSI2PK = :gsi2pk",
            ExpressionAttributeValues: {
                ":gsi2pk": `SONG#${songId}`,
            },
            ExclusiveStartKey: lastEvaluatedKey
        }));

        if (result.Items) allItems.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
}