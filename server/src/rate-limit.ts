/** A bounded token bucket with explicit reclamation of expired keys. */
export class RateLimiter {
  private buckets = new Map<string, { tokens: number; updated: number }>();
  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
    private readonly now = Date.now,
  ) {}
  allow(key: string) {
    const now = this.now();
    const old = this.buckets.get(key);
    const tokens = old
      ? Math.min(
          this.capacity,
          old.tokens + ((now - old.updated) * this.capacity) / this.windowMs,
        )
      : this.capacity;
    this.buckets.set(key, { tokens: Math.max(0, tokens - 1), updated: now });
    return tokens >= 1;
  }
  delete(key: string) {
    this.buckets.delete(key);
  }
  sweep() {
    const cutoff = this.now() - this.windowMs * 2;
    for (const [key, value] of this.buckets)
      if (value.updated < cutoff) this.buckets.delete(key);
  }
}
