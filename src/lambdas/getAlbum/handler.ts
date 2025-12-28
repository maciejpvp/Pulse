import { docClient } from "../../utils/dynamoClient";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getArtistDetails } from "../../utils/getArtistDetails";
import { S3_PUBLIC_URL } from "../../constants";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const { albumId, artistId } = event.arguments.input;

    const info: string[] = event.info.selectionSetList;

    console.log("Info: ", info);

    const needsArtistDetails = info.some(
        item => item === "artist/name" || item === "songs/edges/node/artist/name"
    );

    const artistDetailsResponse = needsArtistDetails ? await getArtistDetails([artistId], musicTable) : null;
    const artistDetails = artistDetailsResponse?.[0];

    const response = await docClient.send(new GetCommand({
        TableName: musicTable,
        Key: {
            PK: `ARTIST#${artistId}`,
            SK: `ALBUM#${albumId}`,
        },
    }));

    const item = response.Item || {};

    console.log(item);

    const album = {
        id: item.SK.split("#")[1],
        name: item.name,
        imageUrl: S3_PUBLIC_URL + item.imageUrl,
        artist: {
            id: item.PK.split("#")[1],
            name: artistDetails?.name,
            imageUrl: S3_PUBLIC_URL + artistDetails?.imageUrl,
        },
    };

    return album;
};


