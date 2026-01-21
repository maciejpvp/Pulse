import { getActiveDevicesList } from "../../services/pulseConnect/getActiveDevicesList";

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized");

        const devices = await getActiveDevicesList(userId);

        return devices;
    } catch (err) {
        console.error(err);
        return [];
    }
}