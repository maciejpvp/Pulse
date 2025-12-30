import { QueryCommand } from "@aws-sdk/lib-dynamodb"
import { docClient } from "../../utils/dynamoClient";
import { decodeCursor, encodeCursor } from "../../utils/cursorUtils";
import { universalBatchGet } from "../../utils/universalBatchGet";
import { S3_PUBLIC_URL } from "../../constants";

const musicTable = process.env.musicTable!;

type Props = {
    userId: string;
    limit?: number;
    after?: string;
}

export const getBookmarksForUser = async (props: Props) => {
    const { userId, limit = 20, after } = props;

    const command = new QueryCommand({
        TableName: musicTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":sk": "BOOKMARK#",
        },
        Limit: limit,
        ExclusiveStartKey: after ? decodeCursor(after) : undefined,
    })

    const result = await docClient.send(command);
    const items = result.Items || [];

    if (items.length === 0) {
        return {
            edges: [],
            pageInfo: {
                hasNextPage: false,
                endCursor: null
            }
        };
    }

    const fullItems = await getFullItems(items);

    return mapToSchema(items, fullItems, result.LastEvaluatedKey);
}

async function getFullItems(items: any[]) {
    const keys = generateKeys(items);

    if (keys.length === 0) return new Map();

    const operations = keys.map(key => ({
        table: musicTable,
        key
    }));

    const results = await universalBatchGet(operations);

    // Create a map for quick lookup
    const resultMap = new Map();
    results.forEach(res => {
        if (res) {
            resultMap.set(`${res.PK}#${res.SK}`, res);
        }
    });

    return resultMap;
}

function generateKeys(items: any[]) {
    const keys: Record<string, any>[] = [];
    items.forEach(item => {
        const { recordId, recordType, artistId } = item;
        switch (recordType) {
            case "PLAYLIST":
                keys.push({ PK: `PLAYLIST#${recordId}`, SK: "METADATA" });
                break;
            case "SONG":
                if (artistId) keys.push({ PK: `ARTIST#${artistId}`, SK: `SONG#${recordId}` });
                break;
            case "ALBUM":
                if (artistId) {
                    keys.push({ PK: `ARTIST#${artistId}`, SK: `ALBUM#${recordId}` });
                    keys.push({ PK: `ARTIST#${artistId}`, SK: "METADATA" });
                }
                break;
            case "ARTIST":
                keys.push({ PK: `ARTIST#${recordId}`, SK: "METADATA" });
                break;
        }
    });
    return keys;
}

function mapToSchema(bookmarkRecords: any[], metadataMap: Map<string, any>, lastEvaluatedKey?: any) {
    const edges = bookmarkRecords.map(record => {
        const { recordId, recordType, artistId } = record;
        let key = "";
        switch (recordType) {
            case "PLAYLIST": key = `PLAYLIST#${recordId}#METADATA`; break;
            case "SONG": key = `ARTIST#${artistId}#SONG#${recordId}`; break;
            case "ALBUM": key = `ARTIST#${artistId}#ALBUM#${recordId}`; break;
            case "ARTIST": key = `ARTIST#${recordId}#METADATA`; break;
        }

        const metadata = metadataMap.get(key);
        if (!metadata) return null;

        let node: any = {
            id: recordId,
            __typename: getTypename(recordType)
        };

        if (recordType === "SONG") {
            node = {
                ...node,
                title: metadata.title,
                artistId: artistId,
            };
        } else if (recordType === "ALBUM") {
            const artistMetadata = metadataMap.get(`ARTIST#${artistId}#METADATA`);
            node = {
                ...node,
                name: metadata.name,
                imageUrl: metadata.imageUrl ? S3_PUBLIC_URL + metadata.imageUrl : null,
                artist: {
                    id: artistId,
                    name: artistMetadata?.name || "Unknown Artist",
                    imageUrl: artistMetadata?.imageUrl ? S3_PUBLIC_URL + artistMetadata.imageUrl : null,
                }
            };
        } else if (recordType === "PLAYLIST" || recordType === "ARTIST") {
            node = {
                ...node,
                name: metadata.name,
                imageUrl: metadata.imageUrl ? S3_PUBLIC_URL + metadata.imageUrl : null,
            };
        }

        return {
            cursor: encodeCursor(record),
            node
        };
    }).filter(Boolean);

    return {
        edges,
        pageInfo: {
            hasNextPage: !!lastEvaluatedKey,
            endCursor: lastEvaluatedKey ? encodeCursor(lastEvaluatedKey) : (edges.length > 0 ? (edges[edges.length - 1]?.cursor || null) : null)
        }
    };
}

function getTypename(recordType: string) {
    switch (recordType) {
        case "SONG": return "SongPreview";
        case "ALBUM": return "AlbumPreview";
        case "ARTIST": return "ArtistPreview";
        case "PLAYLIST": return "PlaylistPreview";
        default: return "";
    }
}