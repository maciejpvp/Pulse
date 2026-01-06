import { removeArtist } from "../../services/artist/removeArtist";

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized: no user identity found");

        const artistId = event.arguments.id;

        const result = await removeArtist(artistId);

        return result;
    } catch (err: unknown) {
        console.error("ERROR in removeArtist:", err);
        return false;
    }
};