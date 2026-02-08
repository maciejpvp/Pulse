import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getChangedAttributes } from "../../services/pulseConnect/getChangedAttributes";
import { executeAppSyncRequest } from "../../utils/appsyncRequest";

const MUTATION = `
            mutation PublishCloudState($input: CloudStateAttributes!) {
                _publishCloudState(input: $input) {
                    primeDeviceId
                    trackId
                    trackArtistId
                    isPlaying
                    positionMs
                    positionUpdatedAt
                    repeatMode
                    shuffleMode
                    volume
                }
            }
        `;

export const handler = async (event: any) => {
    for (const record of event.Records) {
        await handleRecord(record)
    }
}

const ALLOWED_ATTRIBUTES = [
    'primeDeviceId',
    'trackId',
    'trackArtistId',
    'isPlaying',
    'positionMs',
    'positionUpdatedAt',
    'repeatMode',
    'shuffleMode',
    'volume'
];

async function handleRecord(record: any) {
    if (record.eventName !== 'MODIFY') {
        console.log("Not a MODIFY event, skipping diff.");
        return;
    }

    const oldImage = unmarshall(record.dynamodb.OldImage || {});
    const newImage = unmarshall(record.dynamodb.NewImage || {});

    let diff = getChangedAttributes(oldImage, newImage);

    console.log("DIFF", diff)
    console.log("OLD IMAGE", oldImage)
    console.log("NEW IMAGE", newImage)

    // if trackId changed also include trackArtistId
    console.log(diff.updated)
    if (diff.updated.trackId) {
        console.log("Track ID changed", newImage.trackArtistId)
        diff.updated.trackArtistId = newImage.trackArtistId;
    }

    // if positionUpdatedAt changed also include last positionMs
    if (diff.updated.positionUpdatedAt) {
        console.log("Position updated at changed", newImage.positionMs)
        diff.updated.positionMs = newImage.positionMs;
    }

    // Filter only allowed attributes for the mutation
    const filteredUpdate: Record<string, any> = {};
    for (const key of ALLOWED_ATTRIBUTES) {
        if (key in diff.updated) {
            filteredUpdate[key] = diff.updated[key];
        }
    }

    if (Object.keys(filteredUpdate).length === 0) {
        console.log("No relevant attributes changed, skipping AppSync request.");
        return;
    }

    console.log(filteredUpdate)

    await executeAppSyncRequest(MUTATION, {
        input: filteredUpdate,
    })

    console.log("Published changed attributes:", filteredUpdate);
}
