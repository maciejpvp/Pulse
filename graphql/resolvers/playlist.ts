import { createLambdas } from "../../infra/createLambdas"

export const playlistResolvers = (lambdas: ReturnType<typeof createLambdas>) => [
    {
        typeName: "Mutation",
        fieldName: "playlistCreate",
        lambda: lambdas.createPlaylist.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "playlistAddSong",
        lambda: lambdas.addToPlaylist.lambdaFunction,
    },
    {
        typeName: "Mutation",
        fieldName: "playlistRemoveSong",
        lambda: lambdas.removeFromPlaylist.lambdaFunction,
    },
    {
        typeName: "Query",
        fieldName: "playlist",
        lambda: lambdas.getPlaylist.lambdaFunction,
    },
    {
        typeName: "Playlist",
        fieldName: "songs",
        lambda: lambdas.getPlaylistSongs.lambdaFunction,
    },
]
