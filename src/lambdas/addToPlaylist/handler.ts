import { checkPlaylistOwnership } from "../../services/playlist/checkPlaylistOvership";
import { addSongsToPlaylist } from "../../services/playlist/addSongsToPlaylist";
import { isValidUUID } from "../../utils/isValidUUID";

export const handler = async (event: any) => {
    const input = event.arguments.input;

    const { playlistId, songs } = validateInput(input);

    const userId = event.identity?.sub;
    if (!userId) throw new Error("Unauthorized: no user identity found");

    const isCreator = await checkPlaylistOwnership(playlistId, userId);
    if (!isCreator) throw new Error("Playlist not found");

    await addSongsToPlaylist(playlistId, songs);

    return { playlistId, songs: songs.map((song) => song.id) };
};

type SongsType = {
    id: string;
    artistId: string;
};

type InputType = {
    playlistId: string;
    songs: SongsType[];
}

function validateInput(input: InputType): InputType {
    const playlistId = input.playlistId;
    const songs = input.songs;

    if (!isValidUUID(playlistId)) throw new Error("Invalid playlist ID");
    if (!songs?.length) throw new Error("No songs provided");
    if (songs.length > 100) throw new Error("Too many songs");
    if (songs.some((song) => !isValidUUID(song.id))) throw new Error("Invalid song ID");
    if (songs.some((song) => !isValidUUID(song.artistId))) throw new Error("Invalid artist ID");

    return { playlistId, songs };
}