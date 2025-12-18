import { decodeCursor, encodeCursor } from "../../utils/cursorUtils";
import { docClient } from "../../utils/dynamoClient";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = event.source.id;

    const limit = Math.min(event.arguments?.first || 20, 25);
    const after = event.arguments?.after;

    console.log(`Arguments: ${JSON.stringify(event.source)}`);
    console.log(`Artist ID: ${artistId}`);
    console.log(`Limit: ${limit}`);
    console.log(`After: ${after}`);

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

    console.log(`Response: ${JSON.stringify(response)}`);

    const songs = response.Items || [];

    console.log(songs);

    const edges = songs.map(song => {
        return {
            node: {
                id: song.SK.replace("SONG#", ""),
                title: song.title,
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
