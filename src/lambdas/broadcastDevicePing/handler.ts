import { unmarshall } from "@aws-sdk/util-dynamodb";
import { executeAppSyncRequest } from "../../utils/appsyncRequest";

const MUTATION = `
            mutation PublishPing($input: DevicePingInput!) {
                _publishDevicePing(input: $input) {
                    deviceId
                    name
                    type
                }
            }
        `;

export const handler = async (event: any) => {
    for (const record of event.Records) {
        await handleRecord(record)
    }
}

async function handleRecord(record: any) {
    console.log(record)
    const object = getObject(record)

    const input = {
        deviceId: object.SK.split("#")[1],
        name: object.name,
        type: object.type,
    }

    await executeAppSyncRequest(MUTATION, {
        input,
    })

    console.log(object)
}

function getObject(record: any) {
    const rawObject = record.dynamodb.NewImage
    const object = unmarshall(rawObject)

    return object
}