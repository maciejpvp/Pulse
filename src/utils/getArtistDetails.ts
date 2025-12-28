import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamoClient";
import { ArtistPreviewType } from "../types";
import { S3_PUBLIC_URL } from "../constants";

const buildArtistKeys = (ids: string[]) => {
    return ids.map(id => {
        return {
            PK: `ARTIST#${id}`,
            SK: "METADATA"
        }
    })
}

const buildArtistPreview = (artists: { PK: string, name: string, imageUrl: string }[]): ArtistPreviewType[] => {
    return artists.map(artist => {
        return {
            id: artist.PK.replace("ARTIST#", ""),
            name: artist.name,
            imageUrl: S3_PUBLIC_URL + artist.imageUrl,
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
                        ProjectionExpression: "#name, #pk, #imageUrl",
                        ExpressionAttributeNames: {
                            "#name": "name",
                            "#pk": "PK",
                            "#imageUrl": "imageUrl"
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