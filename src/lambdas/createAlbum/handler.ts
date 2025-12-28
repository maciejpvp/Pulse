import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import slugify from "slugify";
import { createGenericPresignedPost } from "../../utils/createPresignedPOST";

const musicTable = process.env.musicTable!;
const picturesBucket = process.env.picturesBucket!;

export const handler = async (event: any) => {

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const { name, artistId } = event.arguments;

    const albumId = uuidv4();
    const now = new Date().toISOString();

    const item = {
        PK: `ARTIST#${artistId}`,
        SK: `ALBUM#${albumId}`,
        name,
        slug: slugify(name),
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    // Generate S3 Presigned POST URL for user to opptionaly upload Album Cover
    const presignedPost = await createGenericPresignedPost({
        bucket: picturesBucket,
        key: `raw/album/${albumId}/cover`,
        metadata: {
            pk: `ARTIST#${artistId}`,
            sk: `ALBUM#${albumId}`,
        },
    });

    return {
        album: {
            id: albumId,
            name,
            artist: {
                id: artistId,
            },
            songs: [],
        },
        imageUrl: presignedPost.uploadUrl,
        fields: presignedPost.fields,
    };
};
