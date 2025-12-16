import { createLambdas } from "../infra/createLambdas"

export const getResolvers = (lambdas: ReturnType<typeof createLambdas>) => {
    return [
        // Mutations
        {
            typeName: "Mutation",
            fieldName: "songUpload",
            lambda: lambdas.getUploadUrl.lambdaFunction,
            dataSourceId: "SongUploadDS",
        },
        {
            typeName: "Mutation",
            fieldName: "playlistCreate",
            lambda: lambdas.createPlaylist.lambdaFunction,
            dataSourceId: "PlaylistCreateDS",
        },
        {
            typeName: "Mutation",
            fieldName: "playlistAddToPlaylist",
            lambda: lambdas.addToPlaylist.lambdaFunction,
            dataSourceId: "AddToPlaylistDS",
        },
        {
            typeName: "Mutation",
            fieldName: "playlistRemoveFromPlaylist",
            lambda: lambdas.removeFromPlaylist.lambdaFunction,
            dataSourceId: "RemoveFromPlaylistDS",
        },
        {
            typeName: "Mutation",
            fieldName: "artistCreate",
            lambda: lambdas.createArtist.lambdaFunction,
            dataSourceId: "ArtistCreateDS",
        },

        // Queries
        {
            typeName: "Query",
            fieldName: "artist",
            lambda: lambdas.getArtist.lambdaFunction,
            dataSourceId: "GetArtistDS",
        },
        {
            typeName: "Query",
            fieldName: "playlist",
            lambda: lambdas.getPlaylist.lambdaFunction,
            dataSourceId: "GetPlaylistDS",
        },
        {
            typeName: "Query",
            fieldName: "songPlay",
            lambda: lambdas.songPlay.lambdaFunction,
            dataSourceId: "SongPlayDS",
        },

        // Field resolvers
        {
            typeName: "Artist",
            fieldName: "songs",
            lambda: lambdas.getArtistSongs.lambdaFunction,
            dataSourceId: "ArtistSongsDS",
        },
        // {
        //     typeName: "Playlist",
        //     fieldName: "songs",
        //     lambda: lambdas.getPlaylistSongs.lambdaFunction,
        //     dataSourceId: "PlaylistSongsDS",
        // }
    ]
}
