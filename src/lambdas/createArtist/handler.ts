import { v4 as uuidv4 } from "uuid";
import { docClient } from "../../utils/dynamoClient";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import slugify from "slugify";
import { createGenericPresignedPost } from "../../utils/createPresignedPOST";

const musicTable = process.env.musicTable!;
const picturesBucket = process.env.picturesBucket!;

export const handler = async (event: any) => {
    const { name } = event.arguments;

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const artistId = uuidv4();
    const now = new Date().toISOString();

    const slug = slugify(name);

    const item = {
        PK: `ARTIST#${artistId}`,
        SK: "METADATA",
        name,
        userId,
        createdAt: now,
        GSI1PK: "ARTIST",
        GSI1SK: slug,
    };

    await docClient.send(new PutCommand({ TableName: musicTable, Item: item }));

    // Generate S3 Presigned POST URL for user to opptionaly upload Artist Picture
    const presignedPost = await createGenericPresignedPost({
        bucket: picturesBucket,
        key: `raw/artist/${artistId}/avatar`,
        metadata: {
            pk: `ARTIST#${artistId}`,
            sk: "METADATA",
        },
    });

    console.log("presignedPost", presignedPost);
    console.log("fields", presignedPost.fields);
    console.log("uploadUrl", presignedPost.uploadUrl);

    return {
        artist: {
            id: artistId,
            name,
            songs: [],
            albums: [],
        },
        profilePictureURL: presignedPost.uploadUrl,
        fields: presignedPost.fields,
    };
};
