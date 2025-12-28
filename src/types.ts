export type SongItem = {
    id: string;
    title: string;
    duration: number;
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