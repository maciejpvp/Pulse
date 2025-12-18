import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = event.arguments.artistId;

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `ARTIST#${artistId}`,
            SK: "METADATA",
        },
    }));

    const artist = response.Item || {};

    console.log(artist);

    const item = {
        id: artist.PK.replace("ARTIST#", ""),
        name: artist.name,
    };

    return item;
};
