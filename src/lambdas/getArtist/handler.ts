import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

const S3_PUBLIC_URL = "https://pulseinfrastack-picturesbucketd39e9407-yv0theoekm4x.s3.eu-central-1.amazonaws.com/";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = event.arguments.artistId || event.source.artist.id;

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `ARTIST#${artistId}`,
            SK: "METADATA",
        },
        ProjectionExpression: "#pk, #name, #avatarUrl",
        ExpressionAttributeNames: {
            "#pk": "PK",
            "#name": "name",
            "#avatarUrl": "avatarUrl",
        },
    }));

    const artist = response.Item || {};

    console.log("artist", artist);

    const item = {
        id: artist.PK.replace("ARTIST#", ""),
        name: artist.name,
        avatarUrl: S3_PUBLIC_URL + artist.avatarUrl,
    };

    return item;
};
