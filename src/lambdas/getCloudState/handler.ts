import { getCloudState } from "../../services/pulseConnect/getCloudState";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized");

    const cloudState = await getCloudState(userId);

    return cloudState;
}