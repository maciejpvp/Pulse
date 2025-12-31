import { S3_PUBLIC_URL } from "../../constants";
import { checkIsItemBookmarked } from "../../services/bookmark/checkIsItemBookmarked";
import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const playlistId = event.arguments.playlistId;
    console.log("Playlist ID: ", playlistId);
    console.log("Arguments: ", event.arguments);
    console.log("Source: ", event.source);

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `PLAYLIST#${playlistId}`,
            SK: "METADATA",
        },
    }));

    const item = response.Item || {};

    // Check if user wants isBookmarked
    const info: string[] = event.info.selectionSetList;
    const wantsBookmarked = info.some((field) => {
        return field === "isBookmarked";
    })

    const playlist = {
        id: item.PK.replace("PLAYLIST#", ""),
        name: item.name,
        imageUrl: S3_PUBLIC_URL + item.imageUrl,
        creator: {
            id: item.creatorId,
        },
        createdAt: item.createdAt,
        visibility: item.visibility,
        isBookmarked: false,
    };

    if (wantsBookmarked) {
        playlist.isBookmarked = await checkIsItemBookmarked(userId, playlistId);
    }

    return playlist;
};
