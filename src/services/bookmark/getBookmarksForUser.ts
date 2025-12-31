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
    console.log("items: ", items)

    const keys = await generateKeys(items);
    const operations = keys.map(key => {
        return {
            table: musicTable,
            key,
        }
    });
    const batchResult = await universalBatchGet(operations);
    console.log("batchResult: ", batchResult);

    const mapped = mapToSchema(batchResult);
    console.log("mapped: ", mapped);

    return mapped;
}

async function generateKeys(items: any[]) {
    const keys = items.map(item => {
        // playlist
        if (item.recordType === "PLAYLIST") {
            return {
                PK: `PLAYLIST#${item.recordId}`,
                SK: "METADATA",
            }
        }
        if (item.recordType === "ALBUM") {
            return {
                PK: `ARTIST#${item.artistId}`,
                SK: `ALBUM#${item.recordId}`,
            }
        }
        if (item.recordType === "ARTIST") {
            return {
                PK: `ARTIST#${item.recordId}`,
                SK: "METADATA",
            }
        }
        if (item.recordType === "SONG") {
            return {
                PK: `ARTIST#${item.artistId}`,
                SK: `SONG#${item.recordId}`,
            }
        }
        return null;
    }).filter((item) => item !== null);

    return keys;
}

function mapToSchema(items: any[]) {
    const mapped = items.map(item => {
        // playlist
        if (item.PK.startsWith("PLAYLIST#") && item.SK === "METADATA") {
            return {
                node: {
                    __typename: "PlaylistPreview",
                    id: item.PK.split("#")[1],
                    name: item.name,
                    imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
                },
                cursor: encodeCursor({
                    PK: item.PK,
                    SK: item.SK,
                })
            }
        }
        // album
        if (item.PK.startsWith("ARTIST#") && item.SK.startsWith("ALBUM#")) {
            return {
                node: {
                    __typename: "AlbumPreview",
                    id: item.SK.split("#")[1],
                    name: item.name,
                    imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
                    artist: {
                        id: item.PK.split("#")[1],
                        name: "#Not Supported",
                    }
                },
                cursor: encodeCursor({
                    PK: item.PK,
                    SK: item.SK,
                })
            }
        }
        // artist
        if (item.PK.startsWith("ARTIST#") && item.SK === "METADATA") {
            return {
                node: {
                    __typename: "ArtistPreview",
                    id: item.PK.split("#")[1],
                    name: item.name,
                    imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
                },
                cursor: encodeCursor({
                    PK: item.PK,
                    SK: item.SK,
                })
            }
        }
        // song
        if (item.PK.startsWith("ARTIST#") && item.SK.startsWith("SONG#")) {
            return {
                node: {
                    __typename: "SongPreview",
                    id: item.SK.split("#")[1],
                    title: item.title,
                    artistId: item.PK.split("#")[1],
                },
                cursor: encodeCursor({
                    PK: item.PK,
                    SK: item.SK,
                })
            }
        }
        return null;
    }).filter((item) => item !== null);

    const edges = mapped.map(edge => {
        return {
            node: edge.node,
            cursor: edge.cursor,
        }
    });

    const pageInfo = {
        endCursor: edges[edges.length - 1].cursor,
        hasNextPage: false,
    };

    return {
        edges,
        pageInfo,
    };
} 