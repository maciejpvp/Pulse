import { BatchOp, universalBatchWrite } from "../../utils/universalBatchWrite";

const musicTable = process.env.musicTable!;

type RecordType = {
    itemId: string;
    artistId?: string;
    itemType: "ALBUM" | "ARTIST" | "PLAYLIST" | "SONG";
}

type Props = {
    userId: string;
    records: RecordType[];
}

export const insertBookmarkRecords = async (props: Props) => {
    const timestamp = new Date().toISOString();

    const operations: BatchOp[] = props.records.map(record => ({
        type: "PUT",
        table: musicTable,
        item: {
            PK: `USER#${props.userId}`,
            SK: `BOOKMARK#${record.itemId}`,
            recordId: record.itemId,
            recordType: record.itemType,
            artistId: record.artistId,
            GSI1PK: `USER#${props.userId}`,
            GSI1SK: `BOOKMARK#${timestamp}#${record.itemId}`,
        },
    }));

    await universalBatchWrite(operations);
}
