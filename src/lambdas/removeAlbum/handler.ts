import { removeAlbum } from "../../services/album/removeAlbum";

type InputType = {
    albumId: string;
    artistId: string;
}

export const handler = async (event: any) => {
    try {
        const userId = event.identity?.sub;
        if (!userId) throw new Error("Unauthorized: no user identity found");

        const input: InputType = event.arguments.input as InputType;

        const albumId = input.albumId;
        const artistId = input.artistId;

        const result = await removeAlbum(albumId, artistId);

        return result;
    } catch (err: unknown) {
        console.error("ERROR in removeAlbum:", err);
        return false;
    }
};