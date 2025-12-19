import { decodeCursor, encodeCursor } from "../../utils/cursorUtils";
import { docClient } from "../../utils/dynamoClient";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = event.source.id;
    const artistName = event.source.name;

    const limit = Math.min(event.arguments?.first || 20, 25);
    const after = event.arguments?.after;

    const response = await docClient.send(new QueryCommand({
        TableName: musicTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `ARTIST#${artistId}`,
            ":sk": "SONG#",
        },
        Limit: limit,
        ExclusiveStartKey: after ? decodeCursor(after) : undefined,
    }));

    const songs = response.Items || [];

    const edges = songs.map(song => {
        return {
            node: {
                id: song.SK.replace("SONG#", ""),
                title: song.title,
                artist: {
                    id: artistId,
                    name: artistName,
                },
            },
            cursor: encodeCursor({ PK: song.PK, SK: song.SK }),
        }
    })

    const pageInfo = {
        endCursor: edges[edges.length - 1].cursor,
        hasNextPage: !!response.LastEvaluatedKey,
    };

    return { edges, pageInfo };
};
