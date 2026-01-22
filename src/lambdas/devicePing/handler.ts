import { updateDeviceMetadata } from "../../services/pulseConnect/updateDeviceMetadata";
import { executeAppSyncRequest } from "../../utils/appsyncRequest";

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized");

        console.log("EVENNT: ", event)

        const input = event.arguments.input;

        const props = {
            userId,
            deviceId: input.deviceId,
            metadata: {
                name: input.name,
                type: input.type,
            },
        };

        await updateDeviceMetadata(props);

        const mutation = `
            mutation PublishPing($input: DevicePingInput!) {
                _publishDevicePing(input: $input) {
                    deviceId
                    name
                    type
                }
            }
        `;

        await executeAppSyncRequest(mutation, {
            input: {
                deviceId: input.deviceId,
                name: input.name,
                type: input.type
            }
        });

        return true
    } catch (err) {
        console.error(err);
        return false
    }

}