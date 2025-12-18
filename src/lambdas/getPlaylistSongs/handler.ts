import { BatchGetCommand, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";
import { decodeCursor, encodeCursor } from "../../utils/cursorUtils";

const TABLE_NAME = process.env.musicTable!;

export const handler = async (event: any) => {
    try {
        const playlistId = event.source?.id;
        if (!playlistId) return { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };

        const limit = Math.min(event.arguments?.first || 20, 25);
        const after = event.arguments?.after;

        // 1. Get song references from playlist
        const playlistSongsQuery: QueryCommandInput = {
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `PLAYLIST#${playlistId}`,
                ":sk": "SONG#",
            },
            Limit: limit,
        };

        if (after) {
            playlistSongsQuery.ExclusiveStartKey = decodeCursor(after);
        }

        const playlistSongsRes = await docClient.send(new QueryCommand(playlistSongsQuery));
        const playlistItems = playlistSongsRes.Items ?? [];

        if (playlistItems.length === 0) {
            return { edges: [], pageInfo: { endCursor: null, hasNextPage: false } };
        }

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

        const fetchedSongs: any[] = [];

        for (const batch of batches) {
            const res = await docClient.send(
                new BatchGetCommand({
                    RequestItems: {
                        [TABLE_NAME]: { Keys: batch },
                    },
                })
            );

            const items = res.Responses?.[TABLE_NAME] ?? [];
            fetchedSongs.push(...items);

            // Handle unprocessed keys (optional, for production)
            let unprocessed = res.UnprocessedKeys?.[TABLE_NAME]?.Keys;
            while (unprocessed && unprocessed.length > 0) {
                const retryRes = await docClient.send(
                    new BatchGetCommand({
                        RequestItems: { [TABLE_NAME]: { Keys: unprocessed } },
                    })
                );
                fetchedSongs.push(...(retryRes.Responses?.[TABLE_NAME] ?? []));
                unprocessed = retryRes.UnprocessedKeys?.[TABLE_NAME]?.Keys;
            }
        }

        // 4. Preserve original playlist order
        const songsOrdered = keys.map(key =>
            fetchedSongs.find(song => song.PK === key.PK && song.SK === key.SK)
        );

        // 5. Map to GraphQL format
        const edges = songsOrdered.map(song => ({
            node: {
                id: song.SK.split("#")[1],
                title: song.title,
                duration: song.duration ?? 0,
                artist: { id: song.PK.split("#")[1] },
            },
            cursor: encodeCursor({ PK: `PLAYLIST#${playlistId}`, SK: song.SK }),
        }));

        const pageInfo = {
            endCursor: edges[edges.length - 1].cursor,
            hasNextPage: !!playlistSongsRes.LastEvaluatedKey,
        };

        return { edges, pageInfo };
    } catch (err) {
        console.error("getPlaylistSongs error:", err);
        throw err;
    }
};
