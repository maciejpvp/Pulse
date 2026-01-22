import { aws_dynamodb, aws_s3, Stack } from "aws-cdk-lib";
import { CreateLambda, CreateLambdaProps } from "../constructs/CreateLambda";

type Props = {
  musicTable: aws_dynamodb.Table;
  songsBucket: aws_s3.Bucket;
  picturesBucket: aws_s3.Bucket;
  stage: string;
};

export const createLambdas = (stack: Stack, props: Props) => {
  const { musicTable, songsBucket, picturesBucket, stage } = props;

  const lambdaConfig: CreateLambdaProps[] = [
    {
      name: "getUploadUrl",
      stage,
      resources: [
        {
          grant: (fn) => songsBucket.grantWrite(fn),
          envName: "songsBucket",
          envValue: songsBucket.bucketName,
        },
      ],
    },
    {
      name: "createPlaylist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => picturesBucket.grantWrite(fn),
          envName: "picturesBucket",
          envValue: picturesBucket.bucketName,
        },
      ],
    },
    {
      name: "addToPlaylist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "removeFromPlaylist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "createArtist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => picturesBucket.grantWrite(fn),
          envName: "picturesBucket",
          envValue: picturesBucket.bucketName,
        },
      ],
    },
    {
      name: "getArtist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getPlaylist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getRecent",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getAlbum",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getSongItem",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getArtistSongs",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getArtistAlbums",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getPlaylistSongs",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getAlbumSongs",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "songPlay",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => songsBucket.grantRead(fn),
          envName: "songsBucket",
          envValue: songsBucket.bucketName,
        }
      ],
    },
    {
      name: "updateUserRecentPlayed",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "createAlbum",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => picturesBucket.grantWrite(fn),
          envName: "picturesBucket",
          envValue: picturesBucket.bucketName,
        },
      ],
    },
    {
      name: "addBookmark",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "removeBookmark",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getBookmarks",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "searchByName",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "removeSong",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => songsBucket.grantReadWrite(fn),
          envName: "songsBucket",
          envValue: songsBucket.bucketName,
        }
      ],
    },
    {
      name: "removeAlbum",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => picturesBucket.grantReadWrite(fn),
          envName: "picturesBucket",
          envValue: picturesBucket.bucketName,
        }
      ],
    },
    {
      name: "removeArtist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
        {
          grant: (fn) => picturesBucket.grantReadWrite(fn),
          envName: "picturesBucket",
          envValue: picturesBucket.bucketName,
        }
      ],
    },
    {
      name: "updateCloudState",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getCloudState",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "devicePing",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadWriteData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    },
    {
      name: "getDevices",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantReadData(fn),
          envName: "musicTable",
          envValue: musicTable.tableName,
        },
      ],
    }
  ];

  const lambdas = Object.fromEntries(
    lambdaConfig.map((config) => [
      config.name,
      new CreateLambda(stack, config),
    ]),
  );

  return lambdas;
};
