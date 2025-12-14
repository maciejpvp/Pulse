import { docClient } from "../../utils/dynamoClient";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = event.source.id;

    console.log(`Arguments: ${JSON.stringify(event.source)}`);
    console.log(`Artist ID: ${artistId}`);

    const response = await docClient.send(new QueryCommand({
        TableName: musicTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `ARTIST#${artistId}`,
            ":sk": "SONG#",
        },
    }));

    console.log(`Response: ${JSON.stringify(response)}`);

    const songs = response.Items || [];

    console.log(songs);

    return (response.Items ?? []).map((item: any) => ({
        id: item.SK.replace("SONG#", ""),
        title: item.title,
        duration: item.duration ?? 0,
        artist: {
            id: artistId,
        },
    }));
};
