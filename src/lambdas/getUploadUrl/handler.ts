import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const bucket = process.env.songsBucket!;

export const handler = async (event: any) => {
  const { songTitle, artistId, albumId, duration } = event.arguments;

  const finalKey = `songs/${Date.now()}-${songTitle}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: finalKey,
    ContentType: "audio/mpeg",
    Metadata: {
      songTitle,
      artistId,
      albumId,
      duration,
    },
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

  return {
    uploadUrl,
    finalKey,
  };
};
