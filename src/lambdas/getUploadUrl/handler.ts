import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

const bucket = process.env.songsBucket!;

export const handler = async (event: any) => {
  const { songTitle, artistId, albumId, duration } = event.arguments.input;

  console.log("Input:", event.arguments.input);

  const sanitizedTitle = songTitle.replace(/[^a-zA-Z0-9-_]/g, "_");
  const finalKey = `songs/${Date.now()}-${sanitizedTitle}.mp3`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: finalKey,
    ContentType: "audio/mpeg",
    Metadata: {
      songTitle,
      artistId,
      albumId,
      duration: duration.toString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    uploadUrl,
  };
};
