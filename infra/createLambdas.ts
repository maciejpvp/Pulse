import { aws_dynamodb, aws_s3, Stack } from "aws-cdk-lib";
import { CreateLambda, CreateLambdaProps } from "../constructs/CreateLambda";

type Props = {
  musicTable: aws_dynamodb.Table;
  songsBucket: aws_s3.Bucket;
  stage: string;
};

export const createLambdas = (stack: Stack, props: Props) => {
  const { musicTable, songsBucket, stage } = props;

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
      ],
    },
    {
      name: "addToPlaylist",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantWriteData(fn),
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
          grant: (fn) => musicTable.grantWriteData(fn),
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
          grant: (fn) => musicTable.grantReadWriteData(fn),
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
      name: "createAlbum",
      stage,
      resources: [
        {
          grant: (fn) => musicTable.grantWriteData(fn),
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
