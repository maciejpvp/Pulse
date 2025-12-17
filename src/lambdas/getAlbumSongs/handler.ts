import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const TABLE_NAME = process.env.musicTable!;

export const handler = async (event: any) => {
    try {
        const albumId = event.arguments?.albumId;
        if (!albumId) return [];

        // 1. Get song references from album
        const albumSongsRes = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": `ALBUM#${albumId}`,
                    ":sk": "SONG#",
                },
            })
        );

        const albumItems = albumSongsRes.Items ?? [];
        console.log("Album items: ", albumItems)
        if (albumItems.length === 0) return [];

        // 2. Build song keys (preserve order)
        const keys = albumItems.map(item => ({
            PK: `ARTIST#${item.songArtistId}`,
            SK: item.SK,
        }));

        // 3. BatchGet (max 100 per request)
        const batches: typeof keys[] = [];
        for (let i = 0; i < keys.length; i += 100) {
            batches.push(keys.slice(i, i + 100));
        }

        const songs = [];

        for (const batch of batches) {
            const res = await docClient.send(
                new BatchGetCommand({
                    RequestItems: {
                        [TABLE_NAME]: {
                            Keys: batch,
                        },
                    },
                })
            );

            const items = res.Responses?.[TABLE_NAME] ?? [];
            for (const item of items) {
                songs.push(item);
            }
        }

        const songsMappedToGraphQL = songs.map(song => ({
            id: song.SK.replace("SONG#", ""),
            title: song.title,
            duration: song.duration ?? 0,
            artist: {
                id: song.PK.replace("ARTIST#", ""),
            },
        }));

        return songsMappedToGraphQL;

    } catch (err) {
        console.error("getPlaylistSongs error:", err);
        throw err;
    }
};

