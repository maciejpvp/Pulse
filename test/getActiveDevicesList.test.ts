import { getActiveDevicesList } from "../src/services/pulseConnect/getActiveDevicesList";
import { docClient } from "../src/utils/dynamoClient";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

jest.mock("../src/utils/dynamoClient", () => ({
    docClient: {
        send: jest.fn(),
    },
}));

describe('getActiveDevicesList', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    beforeAll(() => {
        process.env.musicTable = 'MusicTable';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of devices for a valid userId', async () => {
        const mockItems = [
            { SK: 'DEVICE#device-1', name: 'MacBook', type: 'DESKTOP' },
            { SK: 'DEVICE#device-2', name: 'iPhone', type: 'MOBILE' },
        ];

        (docClient.send as jest.Mock).mockResolvedValue({
            Items: mockItems,
        });

        const result = await getActiveDevicesList(userId);

        expect(result).toEqual([
            { deviceId: 'device-1', name: 'MacBook', type: 'DESKTOP' },
            { deviceId: 'device-2', name: 'iPhone', type: 'MOBILE' },
        ]);

        expect(docClient.send).toHaveBeenCalledWith(expect.any(QueryCommand));
        const command = (docClient.send as jest.Mock).mock.calls[0][0];
        expect(command.input).toEqual({
            TableName: 'MusicTable',
            KeyConditionExpression: "PK = :userId and begins_with(SK, :prefix)",
            ExpressionAttributeValues: {
                ":userId": `USER#${userId}`,
                ":prefix": "DEVICE#",
            },
        });
    });

    it('should return an empty list if no devices are found', async () => {
        (docClient.send as jest.Mock).mockResolvedValue({
            Items: [],
        });

        const result = await getActiveDevicesList(userId);

        expect(result).toEqual([]);
    });

    it('should throw an error if userId is invalid', async () => {
        await expect(getActiveDevicesList('invalid-uuid')).rejects.toThrow();
    });

    it('should throw an error if DynamoDB query fails', async () => {
        (docClient.send as jest.Mock).mockRejectedValue(new Error('DynamoDB Error'));

        await expect(getActiveDevicesList(userId)).rejects.toThrow('DynamoDB Error');
    });
});
