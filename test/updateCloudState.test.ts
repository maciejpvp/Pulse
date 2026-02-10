import { generateUpdateCloudStateCommand } from "../src/services/pulseConnect/updateCloudState";

describe('generateUpdateCloudStateCommand', () => {
    const userId = '12345';

    beforeAll(() => {
        process.env.musicTable = 'MusicTable';
    });

    it('should generate a correct update expression for a single provided attribute and include defaults and version', async () => {
        const params = {
            userId,
            attributes: { volume: 80 }
        };

        const result = await generateUpdateCloudStateCommand(params);

        // Check that volume is updated directly and others use if_not_exists
        expect(result.UpdateExpression).toContain('#volume = :volume');
        expect(result.UpdateExpression).toContain('#primeDeviceId = if_not_exists(#primeDeviceId, :default_primeDeviceId)');
        expect(result.UpdateExpression).toContain('#version = if_not_exists(#version, :zero) + :one');
        expect(result.ExpressionAttributeValues![':volume']).toBe(80);
        expect(result.ExpressionAttributeValues![':default_primeDeviceId']).toBe('none');
        expect(result.ExpressionAttributeValues![':zero']).toBe(0);
        expect(result.ExpressionAttributeValues![':one']).toBe(1);
        expect(result.Key).toEqual({ PK: `USER#${userId}`, SK: 'CLOUDSTATE' });
    });

    it('should use if_not_exists for all default attributes when not provided', async () => {
        const params = {
            userId,
            attributes: { volume: 50 } // Must provide at least one
        };

        const result = await generateUpdateCloudStateCommand(params);

        const defaultKeys = ['primeDeviceId', 'trackId', 'isPlaying', 'positionMs', 'repeatMode', 'shuffleMode'];
        defaultKeys.forEach(key => {
            expect(result.UpdateExpression).toContain(`#${key} = if_not_exists(#${key}, :default_${key})`);
            expect(result.ExpressionAttributeNames![`#${key}`]).toBe(key);
        });
        expect(result.UpdateExpression).toContain('#version = if_not_exists(#version, :zero) + :one');
    });

    it('should handle multiple provided attributes correctly', async () => {
        const params = {
            userId,
            attributes: {
                trackId: 'track-001',
                positionMs: '5000'
            }
        };

        const result = await generateUpdateCloudStateCommand(params);

        expect(result.UpdateExpression).toContain('#trackId = :trackId');
        expect(result.UpdateExpression).toContain('#positionMs = :positionMs');
        expect(result.UpdateExpression).toContain('#version = if_not_exists(#version, :zero) + :one');
        expect(result.ExpressionAttributeValues![':trackId']).toBe('track-001');
        expect(result.ExpressionAttributeValues![':positionMs']).toBe('5000');
    });

    it('should handle attributes not in DEFAULT_VALUES', async () => {
        const params = {
            userId,
            attributes: {
                customAttr: 'customValue'
            }
        } as any;

        const result = await generateUpdateCloudStateCommand(params);

        expect(result.UpdateExpression).toContain('#customAttr = :customAttr');
        expect(result.UpdateExpression).toContain('#version = if_not_exists(#version, :zero) + :one');
        expect(result.ExpressionAttributeValues![':customAttr']).toBe('customValue');
    });

    it('should include ConditionExpression when version is provided', async () => {
        const params = {
            userId,
            version: 5,
            attributes: { volume: 70 }
        };

        const result = await generateUpdateCloudStateCommand(params);

        expect(result.ConditionExpression).toBe("attribute_not_exists(#version) OR #version = :version");
        expect(result.ExpressionAttributeValues![':version']).toBe(5);
        expect(result.ExpressionAttributeNames!['#version']).toBe('version');
    });

    it('should throw error if no attributes provided', async () => {
        const params = {
            userId,
            attributes: {}
        };

        await expect(generateUpdateCloudStateCommand(params))
            .rejects
            .toThrow("No attributes provided");
    });
});