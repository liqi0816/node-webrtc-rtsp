export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = <TError>(ms: number, desc?: TError) => new Promise<never>((_, reject) => setTimeout(() => reject(desc), ms));

export const yieldThread = setImmediate ? () => new Promise(setImmediate) : () => new Promise(setTimeout as any);

export const mapMap = function* mapMap<K, V, U>(map: Map<K, V>, func: (v: V) => U): IterableIterator<[K, U]> {
    for (const [k, v] of map) {
        yield [k, func(v)];
    }
}
