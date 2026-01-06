import { docClient } from "../../utils/dynamoClient";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { BatchOp, universalBatchWrite } from "../../utils/universalBatchWrite";
import { isValidUUID } from "../../utils/isValidUUID";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const musicTable = process.env.musicTable!;
const picturesBucket = process.env.picturesBucket!;

const s3Client = new S3Client({});

export const removeArtist = async (artistId: string) => {
    try {
        if (!isValidUUID(artistId)) return false;

        const result = await docClient.send(new GetCommand({
            TableName: musicTable,
            Key: {
                PK: `ARTIST#${artistId}`,
                SK: "METADATA",
            },
        }));

        const item = result.Item;
        if (!item) return false;

        // TODO: Race condition possible here
        const isEmpty = await checkIsArtistEmpty(artistId);
        if (!isEmpty) return false;

        await removeArtistImage(item.imageUrl);

        const operations: BatchOp[] = [
            {
                type: "DELETE",
                table: musicTable,
                key: {
                    PK: `ARTIST#${artistId}`,
                    SK: "METADATA",
                }
            }
        ];

        const items = await fetchAllArtistRelatedItems(artistId);

        const filteredItems = items.filter(related =>
            !(related.PK === `ARTIST#${artistId}`)
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


        return true;
    } catch (err: unknown) {
        console.error("ERROR in removeAlbum:", err);
        return false;
    }
}

async function fetchAllArtistRelatedItems(artistId: string) {
    let allItems: any[] = [];
    let lastEvaluatedKey: any = undefined;

    do {
        const result = await docClient.send(new QueryCommand({
            TableName: musicTable,
            IndexName: "GSI2",
            KeyConditionExpression: "GSI2PK = :gsi2pk",
            ExpressionAttributeValues: {
                ":gsi2pk": `ARTIST#${artistId}`,
            },
            ExclusiveStartKey: lastEvaluatedKey
        }));

        if (result.Items) allItems.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
}

async function checkIsArtistEmpty(artistId: string) {
    const result = await docClient.send(new QueryCommand({
        TableName: musicTable,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
            ":pk": `ARTIST#${artistId}`,
        },
        Limit: 1,
    }));

    return result.Count === 0;
}


async function removeArtistImage(imageKey: string) {
    const command = new DeleteObjectCommand({
        Bucket: picturesBucket,
        Key: imageKey,
    });

    await s3Client.send(command);
}