import { docClient } from "../../utils/dynamoClient";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { S3_PUBLIC_URL } from "../../constants";

const musicTable = process.env.musicTable!;

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const songId = event.arguments.songId;
    const artistId = event.arguments.artistId;

    const keys = [
        {
            PK: `ARTIST#${artistId}`,
            SK: `SONG#${songId}`,
        },
        {
            PK: `ARTIST#${artistId}`,
            SK: "METADATA",
        }
    ];

    const res = await docClient.send(new BatchGetCommand({
        RequestItems: {
            [musicTable]: {
                Keys: keys,
                ProjectionExpression: "#pk, #sk, #title, #duration, #name, #imageUrl",
                ExpressionAttributeNames: {
                    "#pk": "PK",
                    "#sk": "SK",
                    "#title": "title",
                    "#duration": "duration",
                    "#name": "name",
                    "#imageUrl": "imageUrl",
                },
            },
        },
        ReturnConsumedCapacity: "TOTAL",
    }))

    console.log("Consumed capacity:", res.ConsumedCapacity);



    const responses = res.Responses?.[musicTable];

    console.log("Responses:", responses);

    if (!responses?.length) throw new Error("No responses found");

    const song = responses.find((item) => item.PK.startsWith(`ARTIST#`) && item.SK.startsWith(`SONG#`));
    const artist = responses.find((item) => item.PK.startsWith(`ARTIST#`) && item.SK.startsWith("METADATA"));
    console.log("Song:", song);
    console.log("Artist:", artist);

    if (!song || !artist) throw new Error("Song or artist not found");


    const item = {
        id: songId,
        title: song.title,
        duration: song.duration ?? 0,
        imageUrl: song.imageUrl ? S3_PUBLIC_URL + song.imageUrl : undefined,
        artist: {
            id: artistId,
            name: artist.name,
            imageUrl: artist.imageUrl ? S3_PUBLIC_URL + artist.imageUrl : undefined,
        },
    }

    console.log("Item:", item);

    return item;
};

