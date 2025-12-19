export type SongItem = {
    id: string;
    title: string;
    duration: number;
    artist: {
        id: string;
        name: string;
    };
}