import { generateUpdateCloudStateCommand, updateCloudState } from "../../services/pulseConnect/updateCloudState";

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized");

        const { attributes, version } = event.arguments.input;
        if (!attributes) throw new Error("attributes are required");

        const commandInput = await generateUpdateCloudStateCommand({
            userId,
            attributes,
            version,
        });

        await updateCloudState(commandInput);
        return true
    } catch (error) {
        console.error("Error updating cloud state:", error);
        return false
    }
}