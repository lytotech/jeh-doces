import { Injectable } from '@nestjs/common';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxBuckets = 10_000;

  consume(key: string, limit: number, windowSeconds: number) {
    const now = Date.now();
    const current = this.buckets.get(key);
    const bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowSeconds * 1000 }
        : current;

    bucket.count += 1;
    this.buckets.set(key, bucket);
    this.prune(now);

    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  reset() {
    this.buckets.clear();
  }

  private prune(now: number) {
    if (this.buckets.size <= this.maxBuckets) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
      if (this.buckets.size <= this.maxBuckets) break;
    }
  }
}
