import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";
import { decodeCursor, encodeCursor } from "../../utils/cursorUtils";
import { S3_PUBLIC_URL } from "../../constants";

const TABLE_NAME = process.env.musicTable!;

export const handler = async (event: any) => {
    try {
        console.log("Source: ", event.source);
        console.log("Arguments: ", event.arguments);
        const albumId = event.source.id;

        const artistId = event.source.artist.id;
        const artistName = event.source.artist.name;
        const artistImageUrl = event.source.artist.imageUrl;

        if (!albumId) return {
            edges: [],
            pageInfo: {
                endCursor: null,
                hasNextPage: false,
            }
        };

        const limit = Math.min(event.arguments?.first || 20, 25);
        const after = event.arguments?.after;

        // 1. Get song references from album
        const albumSongsRes = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": `ALBUM#${albumId}`,
                    ":sk": "SONG#",
                },
                Limit: limit,
                ExclusiveStartKey: after ? decodeCursor(after) : undefined,
            })
        );

        const albumItems = albumSongsRes.Items ?? [];
        console.log("Album items: ", albumItems)
        if (albumItems.length === 0) {
            return {
                edges: [],
                pageInfo: {
                    endCursor: null,
                    hasNextPage: false,
                }
            }
        };

        // 2. Build song keys (preserve order)
        const keys = albumItems.map(item => ({
            PK: `ARTIST#${item.songArtistId}`,
            SK: item.SK ?? null,
        })).filter(item => item.SK !== null);

        // 3. BatchGet (max 100 per request)
        const batches: typeof keys[] = [];
        for (let i = 0; i < keys.length; i += 100) {
            batches.push(keys.slice(i, i + 100));
        }

        const songs: any[] = [];

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

        const songsOrdered = keys.map(key =>
            songs.find(song => song.PK === key.PK && song.SK === key.SK)
        ).filter(song => song !== undefined);

        const edges = songsOrdered.map(song => {
            return {
                node: {
                    id: song.SK.replace("SONG#", ""),
                    title: song.title,
                    duration: song.duration ?? 0,
                    imageUrl: song.imageUrl ? S3_PUBLIC_URL + song.imageUrl : null,
                    artist: {
                        id: artistId,
                        name: artistName,
                        imageUrl: artistImageUrl,
                    },
                },
                cursor: encodeCursor({ PK: `ALBUM#${albumId}`, SK: song.SK }),
            }
        })

        const pageInfo = {
            endCursor: edges[edges.length - 1].cursor,
            hasNextPage: !!albumSongsRes.LastEvaluatedKey,
        };

        return { edges, pageInfo };

    } catch (err) {
        console.error("getPlaylistSongs error:", err);
        throw err;
    }
};

