import { docClient } from "../../utils/dynamoClient";
import { BatchGetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const musicTable = process.env.musicTable!;

const batchGetItems = async (keys: { PK: string, SK: string }[]) => {
    const BATCH_SIZE = 100; // max na request
    const results: any[] = [];

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batchKeys = keys.slice(i, i + BATCH_SIZE);

        const command = new BatchGetCommand({
            RequestItems: {
                [musicTable]: {
                    Keys: batchKeys,
                },
            },
        });

        const response = await docClient.send(command);
        results.push(...(response.Responses?.[musicTable] || []));
    }

    return results;
};

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    console.log("Arguments: ", event.arguments);
    console.log("Source: ", event.source);

    const getListeningEventsQuery = {
        TableName: musicTable,
        IndexName: "SearchIndex",
        KeyConditionExpression: "GSI1PK = :userId",
        ExpressionAttributeValues: {
            ":userId": `USER#${userId}`,
        },
        ScanIndexForward: false,
        Limit: 10,
    };

    const { Items } = await docClient.send(new QueryCommand(getListeningEventsQuery));
    const listeningEvents = Items || [];

    console.log(listeningEvents);

    const batch = listeningEvents.map(event => {
        // Song
        if (event.contextType === "SONG") {
            return {
                PK: `ARTIST#${event.artistId}`,
                SK: `SONG#${event.contextId}`,
            };
        }
        // Album
        if (event.contextType === "ALBUM") {
            return {
                PK: `ARTIST#${event.artistId}`,
                SK: `ALBUM#${event.contextId}`,
            };
        }
        // Playlist
        if (event.contextType === "PLAYLIST") {
            return {
                PK: `PLAYLIST#${event.contextId}`,
                SK: "METADATA",
            };
        }
        // Artist
        if (event.contextType === "ARTIST") {
            return {
                PK: `ARTIST#${event.artistId}`,
                SK: "METADATA",
            };
        }

        return null;
    }).filter(item => item !== null);

    const items = await batchGetItems(batch);

    console.log(items);

    // Mapping to GraphQL Schema

    const recentPlayedItems = items.map(item => {
        // Song
        if (item.PK.startsWith("ARTIST#") && item.SK.startsWith("SONG#")) {
            return {
                __typename: "SongPreview",
                id: item.SK.split("#")[1],
                artistId: item.PK.split("#")[1],
                title: item.title,
            };
        }
        // Album
        if (item.PK.startsWith("ARTIST#") && item.SK.startsWith("ALBUM#")) {
            return {
                __typename: "AlbumPreview",
                id: item.SK.split("#")[1],
                name: item.name,
                artist: {
                    id: item.PK.split("#")[1],
                    name: "#Not Supported",
                }
            };
        }
        // Playlist
        if (item.PK.startsWith("PLAYLIST#") && item.SK === "METADATA") {
            return {
                __typename: "PlaylistPreview",
                id: item.PK.split("#")[1],
                name: item.name,
            };
        }
        // Artist
        if (item.PK.startsWith("ARTIST#") && item.SK === "METADATA") {
            return {
                __typename: "ArtistPreview",
                id: item.PK.split("#")[1],
                name: item.name,
            };
        }

        return null
    }).filter(item => item !== null);

    return recentPlayedItems;
};



