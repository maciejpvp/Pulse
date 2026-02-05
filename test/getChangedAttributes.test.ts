import { getChangedAttributes } from '../src/services/pulseConnect/getChangedAttributes';

describe('getChangedAttributes', () => {

    describe('Primitive Values', () => {
        it('should detect added attributes', () => {
            const oldItem = {};
            const newItem = { name: 'John', age: 30 };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ name: 'John', age: 30 });
            expect(result.removed).toEqual([]);
        });

        it('should detect updated attributes', () => {
            const oldItem = { name: 'John', age: 25 };
            const newItem = { name: 'John', age: 30 };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ age: 30 });
            expect(result.removed).toEqual([]);
        });

        it('should detect removed attributes', () => {
            const oldItem = { name: 'John', age: 30 };
            const newItem = { name: 'John' };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({});
            expect(result.removed).toEqual(['age']);
        });

        it('should return empty diff for identical primitives', () => {
            const item = { name: 'John', age: 30, active: true, score: null };
            const result = getChangedAttributes(item, item);
            expect(result.updated).toEqual({});
            expect(result.removed).toEqual([]);
        });
    });

    describe('Nested Objects', () => {
        it('should detect changes in nested objects', () => {
            const oldItem = {
                user: { profile: { theme: 'dark', lang: 'en' } }
            };
            const newItem = {
                user: { profile: { theme: 'light', lang: 'en' } }
            };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({
                user: {
                    updated: {
                        profile: {
                            updated: { theme: 'light' },
                            removed: []
                        }
                    },
                    removed: []
                }
            });
        });

        it('should detect additions in nested objects', () => {
            const oldItem = { settings: { volume: 50 } };
            const newItem = { settings: { volume: 50, bass: 10 } };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({
                settings: {
                    updated: { bass: 10 },
                    removed: []
                }
            });
        });

        it('should detect removals in nested objects', () => {
            const oldItem = { settings: { volume: 50, bass: 10 } };
            const newItem = { settings: { volume: 50 } };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({
                settings: {
                    updated: {},
                    removed: ['bass']
                }
            });
        });

        it('should treat object type swaps as direct updates', () => {
            const oldItem = { data: 'not an object' };
            const newItem = { data: { key: 'value' } };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ data: { key: 'value' } });
        });
    });

    describe('Special Types (Arrays, Dates, Nulls)', () => {
        it('should treat arrays as atomic values', () => {
            const oldItem = { tags: ['a', 'b'] };
            const newItem = { tags: ['a', 'c'] };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ tags: ['a', 'c'] });
        });

        it('should detect Date changes correctly', () => {
            const date1 = new Date('2023-01-01');
            const date2 = new Date('2023-01-02');
            const oldItem = { createdAt: date1 };
            const newItem = { createdAt: date2 };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ createdAt: date2 });
        });

        it('should not detect changes for identical Dates', () => {
            const date1 = new Date('2023-01-01');
            const date2 = new Date('2023-01-01');
            const oldItem = { createdAt: date1 };
            const newItem = { createdAt: date2 };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({});
        });

        it('should handle null values correctly', () => {
            const oldItem = { value: 123 };
            const newItem = { value: null };
            const result = getChangedAttributes(oldItem, newItem);
            expect(result.updated).toEqual({ value: null });
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined parameters', () => {
            const result = getChangedAttributes(undefined, { a: 1 });
            expect(result.updated).toEqual({ a: 1 });
            expect(result.removed).toEqual([]);
        });

        it('should handle empty objects', () => {
            const result = getChangedAttributes({}, {});
            expect(result.updated).toEqual({});
            expect(result.removed).toEqual([]);
        });
    });
});
