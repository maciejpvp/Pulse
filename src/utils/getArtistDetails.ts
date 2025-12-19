import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamoClient";

const buildArtistKeys = (ids: string[]) => {
    return ids.map(id => {
        return {
            PK: `ARTIST#${id}`,
            SK: "METADATA"
        }
    })
}

const buildArtistPreview = (artists: { PK: string, name: string }[]) => {
    return artists.map(artist => {
        return {
            id: artist.PK.replace("ARTIST#", ""),
            name: artist.name,
        }
    })
}

const fetchArtistDetails = async (artistKeys: { PK: string, SK: string }[], tableName: string) => {
    const batches: typeof artistKeys[] = [];
    for (let i = 0; i < artistKeys.length; i += 100) {
        batches.push(artistKeys.slice(i, i + 100));
    }

    const artistsDatabaseObjects: any[] = [];
    for (const batch of batches) {
        const res = await docClient.send(
            new BatchGetCommand({
                RequestItems: {
                    [tableName]: {
                        Keys: batch,
                        ProjectionExpression: "#name, #pk",
                        ExpressionAttributeNames: {
                            "#name": "name",
                            "#pk": "PK"
                        }
                    },
                },
            })
        );

        const items = res.Responses?.[tableName] ?? [];
        for (const item of items) {
            artistsDatabaseObjects.push(item);
        }
    }

    return artistsDatabaseObjects;
}

export const getArtistDetails = async (artistsIds: string[], tableName: string) => {
    // Dedupe artistsIds
    const uniqueArtistsIds = [...new Set(artistsIds)];

    // Build artist keys
    const artistKeys = buildArtistKeys(uniqueArtistsIds);

    // Fetch artist details
    const artistsDatabaseObjects = await fetchArtistDetails(artistKeys, tableName);

    // Build artist preview
    const artists = buildArtistPreview(artistsDatabaseObjects);

    console.log("Artists: ", artists);

    return artists;
}   