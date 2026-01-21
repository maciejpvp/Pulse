import { updateDeviceMetadata } from "../../services/pulseConnect/updateDeviceMetadata";

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

        return true
    } catch (err) {
        console.error(err);
        return false
    }

}