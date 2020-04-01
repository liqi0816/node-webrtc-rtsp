export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = <TError>(ms: number, desc?: TError) => new Promise<never>((_, reject) => setTimeout(() => reject(desc), ms));

export const yieldThread = setImmediate ? () => new Promise(setImmediate) : () => new Promise(setTimeout as any);
