/**
 * Minimal stand-in for discord.js's `Collection<K, V>` (a Map subclass with array-style helpers).
 * Only implements what the source under test actually calls: filter, map, some.
 */
export class FakeCollection<K, V> extends Map<K, V> {
  filter(fn: (value: V, key: K) => boolean): FakeCollection<K, V> {
    const result = new FakeCollection<K, V>();
    for (const [k, v] of this) if (fn(v, k)) result.set(k, v);
    return result;
  }

  map<T>(fn: (value: V, key: K) => T): T[] {
    const out: T[] = [];
    for (const [k, v] of this) out.push(fn(v, k));
    return out;
  }

  some(fn: (value: V, key: K) => boolean): boolean {
    for (const [k, v] of this) if (fn(v, k)) return true;
    return false;
  }
}
