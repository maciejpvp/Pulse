import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../../utils/dynamoClient";
import { S3_PUBLIC_URL } from "../../constants";

type Props = {
    query: string;
    type: "SONG" | "ALBUM" | "PLAYLIST" | "ARTIST";
}

const musicTable = process.env.musicTable!;

export const searchItems = async (props: Props) => {
    const { query, type } = props;

    const condition = "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :query)";

    const values = {
        ":gsi1pk": type,
        ":query": query,
    };

    const commandInput: QueryCommandInput = {
        TableName: musicTable,
        IndexName: "SearchIndex",
        KeyConditionExpression: condition,
        ExpressionAttributeValues: values,
        Limit: 5,
    };

    const command = new QueryCommand(commandInput);

    const response = await docClient.send(command);

    const items = response.Items || [];

    const mapped = mapToSchema(items);

    console.log("mapped: ", mapped);

    return mapped;
}

function mapToSchema(items: any[]) {
    const mapped = items.map(item => {
        // artist
        if (item.GSI1PK === "ARTIST") {
            return {
                __typename: "ArtistPreview",
                id: item.PK.split("#")[1],
                name: item.name,
                imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
            }
        }
        // album
        if (item.GSI1PK === "ALBUM") {
            return {
                __typename: "AlbumPreview",
                id: item.SK.split("#")[1],
                name: item.name,
                imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
                artist: {
                    id: item.PK.split("#")[1],
                    name: "",
                }
            }
        }
        // playlist
        if (item.GSI1PK === "PLAYLIST") {
            return {
                __typename: "PlaylistPreview",
                id: item.PK.split("#")[1],
                name: item.name,
                imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
            }
        }
        // song
        if (item.GSI1PK === "SONG") {
            return {
                __typename: "SongPreview",
                id: item.SK.split("#")[1],
                title: item.title,
                artistId: item.PK.split("#")[1],
                imageUrl: item.imageUrl ? S3_PUBLIC_URL + item.imageUrl : null,
            }
        }
        return null;
    }).filter((item) => item !== null);

    return mapped;
}
