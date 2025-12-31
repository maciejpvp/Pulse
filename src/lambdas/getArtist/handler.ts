import { S3_PUBLIC_URL } from "../../constants";
import { checkIsItemBookmarked } from "../../services/bookmark/checkIsItemBookmarked";
import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;


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
        ProjectionExpression: "#pk, #name, #imageUrl",
        ExpressionAttributeNames: {
            "#pk": "PK",
            "#name": "name",
            "#imageUrl": "imageUrl",
        },
    }));

    const artist = response.Item || {};

    const info: string[] = event.info.selectionSetList;
    console.log("Info: ", info);
    const wantsBookmarked = info.some((field) => {
        return field === "isBookmarked";
    });

    const item = {
        id: artist.PK.replace("ARTIST#", ""),
        name: artist.name,
        imageUrl: S3_PUBLIC_URL + artist.imageUrl,
        isBookmarked: false,
    };

    if (wantsBookmarked) {
        item.isBookmarked = await checkIsItemBookmarked(userId, artistId);
    }

    return item;
};
