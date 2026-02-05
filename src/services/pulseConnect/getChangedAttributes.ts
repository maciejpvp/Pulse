export type DiffResult = {
    updated: Record<string, any>;
    removed: string[];
};

/**
 * Performs a deep comparison between two objects to find changes.
 * 
 * @param oldItem - The previous state of the object.
 * @param newItem - The new state of the object.
 * @returns A DiffResult containing updated keys/values and removed keys.
 */
export function getChangedAttributes(oldItem: any = {}, newItem: any = {}): DiffResult {
    const updated: Record<string, any> = {};
    const removed: string[] = [];

    // Identify Updates and Additions
    const newItemKeys = Object.keys(newItem);
    for (let i = 0; i < newItemKeys.length; i++) {
        const key = newItemKeys[i];
        const oldVal = oldItem[key];
        const newVal = newItem[key];

        // Strict equality check
        if (oldVal === newVal) continue;

        if (isPlainObject(newVal) && isPlainObject(oldVal)) {
            // Recursive diff for nested plain objects
            const nestedDiff = getChangedAttributes(oldVal, newVal);

            // Only record nested diff if it contains actual changes
            if (hasChanges(nestedDiff)) {
                updated[key] = nestedDiff;
            }
        } else if (isDate(newVal) && isDate(oldVal)) {
            // Date comparison
            if (newVal.getTime() !== oldVal.getTime()) {
                updated[key] = newVal;
            }
        } else {
            // Fallback for primitives, arrays, or different types
            updated[key] = newVal;
        }
    }

    // Identify Removals
    const oldItemKeys = Object.keys(oldItem);
    for (let i = 0; i < oldItemKeys.length; i++) {
        const key = oldItemKeys[i];
        if (!(key in newItem)) {
            removed.push(key);
        }
    }

    return { updated, removed };
}

/**
 * Checks if a value is a plain object (not an array, null, Date, etc.)
 */
function isPlainObject(val: any): boolean {
    if (typeof val !== 'object' || val === null || Array.isArray(val) || isDate(val)) {
        return false;
    }
    const proto = Object.getPrototypeOf(val);
    return proto === Object.prototype || proto === null;
}

/**
 * Specifically checks for Date objects.
 */
function isDate(val: any): val is Date {
    return val instanceof Date || Object.prototype.toString.call(val) === '[object Date]';
}

/**
 * Helper to check if a DiffResult indicates any change.
 */
function hasChanges(diff: DiffResult): boolean {
    return Object.keys(diff.updated).length > 0 || diff.removed.length > 0;
}
