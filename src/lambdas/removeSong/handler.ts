import { removeSong } from "../../services/song/removeSong";

type InputType = {
    songId: string;
    artistId: string;
}

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized: no user identity found");

        const input: InputType = event.arguments.input as InputType;

        await removeSong({
            songId: input.songId,
            artistId: input.artistId,
        });

        return true;
    } catch (err: unknown) {
        console.error("ERROR in removeSongs:", err);
        return false;
    }
};