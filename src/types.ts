export type SongItem = {
    id: string;
    title: string;
    duration: number;
    imageUrl: string | null;
    artist: {
        id: string;
        name: string;
    };
}

export type ArtistPreviewType = {
    id: string;
    name: string;
    imageUrl?: string;
}