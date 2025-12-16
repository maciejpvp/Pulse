import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";

const TABLE_NAME = process.env.musicTable!;

export const handler = async (event: any) => {
    try {
        const playlistId = event.source?.id;
        if (!playlistId) return [];

        // 1. Get song references from playlist
        const playlistSongsRes = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": `PLAYLIST#${playlistId}`,
                    ":sk": "SONG#",
                },
            })
        );

        const playlistItems = playlistSongsRes.Items ?? [];
        console.log("Playlist items: ", playlistItems)
        if (playlistItems.length === 0) return [];

        // 2. Build song keys (preserve order)
        const keys = playlistItems.map(item => ({
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
