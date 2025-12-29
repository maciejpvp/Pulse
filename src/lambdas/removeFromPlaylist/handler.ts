import { checkPlaylistOwnership } from "../../services/playlist/checkPlaylistOvership";
import { removeSongsFromPlaylist } from "../../services/playlist/removeSongsFromPlaylist";
import { isValidUUID } from "../../utils/isValidUUID";

export const handler = async (event: any) => {
    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const input = event.arguments.input;
    const { playlistId, songsIds } = validateInput(input);

    // Check if playlist exists
    const isCreator = await checkPlaylistOwnership(playlistId, userId);
    if (!isCreator) throw new Error("Playlist not found");

    await removeSongsFromPlaylist(playlistId, songsIds);

    return { playlistId, songsIds };
};

type InputType = {
    playlistId: string;
    songsIds: string[];
}

function validateInput(input: InputType): InputType {
    const playlistId = input.playlistId;
    const songsIds = input.songsIds;

    if (!isValidUUID(playlistId)) throw new Error("Invalid playlist ID");
    if (!songsIds?.length) throw new Error("No songs provided");
    if (songsIds.length > 100) throw new Error("Too many songs");
    if (songsIds.some((songId) => !isValidUUID(songId))) throw new Error("Invalid song ID");

    return { playlistId, songsIds };
}
