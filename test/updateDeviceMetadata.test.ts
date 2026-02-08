import { generateUpdateDeviceMetadataCommand } from "../src/services/pulseConnect/updateDeviceMetadata";

describe('generateUpdateDeviceMetadataCommand', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000'; // Valid v4 UUID
    const deviceId = 'device-123';

    beforeAll(() => {
        process.env.musicTable = 'MusicTable';
        jest.useFakeTimers().setSystemTime(new Date('2026-01-17T18:00:00Z'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should generate a correct update command for valid inputs', () => {
        const props = {
            userId,
            deviceId,
            metadata: {
                name: 'My MacBook',
                type: 'DESKTOP' as const
            }
        };

        const result = generateUpdateDeviceMetadataCommand(props);

        expect(result.TableName).toBe('MusicTable');
        expect(result.Key).toEqual({
            PK: `USER#${userId}`,
            SK: `DEVICE#${deviceId}`
        });
        expect(result.UpdateExpression).toBe("SET #name = :name, #type = :type, #updated_at = :updated_at, #ttl = :ttl");
        expect(result.ExpressionAttributeNames).toEqual({
            "#name": "name",
            "#type": "type",
            "#updated_at": "updated_at",
            "#ttl": "ttl"
        });
        const expectedUpdatedAt = Math.floor(Date.now() / 1000);
        expect(result.ExpressionAttributeValues).toEqual({
            ":name": 'My MacBook',
            ":type": 'DESKTOP',
            ":updated_at": expectedUpdatedAt,
            ":ttl": expectedUpdatedAt + 24 * 60 * 60
        });
    });

    it('should throw error if userId is not a valid v4 UUID', () => {
        const props = {
            userId: 'invalid-uuid',
            deviceId,
            metadata: {
                name: 'My MacBook',
                type: 'DESKTOP' as const
            }
        };

        expect(() => generateUpdateDeviceMetadataCommand(props)).toThrow();
    });

    it('should throw error if metadata name is empty', () => {
        const props = {
            userId,
            deviceId,
            metadata: {
                name: '',
                type: 'DESKTOP' as const
            }
        };

        expect(() => generateUpdateDeviceMetadataCommand(props)).toThrow();
    });

    it('should throw error if metadata name is too long', () => {
        const props = {
            userId,
            deviceId,
            metadata: {
                name: 'a'.repeat(256),
                type: 'DESKTOP' as const
            }
        };

        expect(() => generateUpdateDeviceMetadataCommand(props)).toThrow();
    });

    it('should throw error if metadata type is invalid', () => {
        const props = {
            userId,
            deviceId,
            metadata: {
                name: 'My MacBook',
                type: 'INVALID_TYPE' as any
            }
        };

        expect(() => generateUpdateDeviceMetadataCommand(props)).toThrow();
    });

    it('should throw error if metadata is missing', () => {
        const props = {
            userId,
            deviceId,
        } as any;

        expect(() => generateUpdateDeviceMetadataCommand(props)).toThrow();
    });
});
