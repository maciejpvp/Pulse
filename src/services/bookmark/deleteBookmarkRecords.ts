import { BatchOp, universalBatchWrite } from "../../utils/universalBatchWrite";

const musicTable = process.env.musicTable!;

type Props = {
    userId: string;
    recordIds: string[];
}

export const deleteBookmarkRecords = async (props: Props) => {
    const operations: BatchOp[] = props.recordIds.map(recordId => ({
        type: "DELETE",
        table: musicTable,
        key: {
            PK: `USER#${props.userId}`,
            SK: `BOOKMARK#${recordId}`,
        },
    }));

    await universalBatchWrite(operations);
}

