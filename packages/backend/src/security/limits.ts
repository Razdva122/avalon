/** Fixed-window counters with bounded memory; shared by all connections in this process. */
export class WindowLimiter {
  private entries = new Map<string, { count: number; expires: number }>();
  constructor(private capacity = 20000) {}
  take(key: string, max: number, windowMs: number, now = Date.now()): boolean {
    let entry = this.entries.get(key);
    if (entry && entry.expires <= now) {
      this.entries.delete(key);
      entry = undefined;
    }
    if (!entry) {
      if (this.entries.size >= this.capacity) {
        for (const [id, item] of this.entries) if (item.expires <= now) this.entries.delete(id);
        if (this.entries.size >= this.capacity) return false;
      }
      entry = { count: 0, expires: now + windowMs };
      this.entries.set(key, entry);
    }
    if (entry.count >= max) return false;
    entry.count++;
    return true;
  }
}
/** No queue: protect the bcrypt thread pool even when distributed clients rotate IPs. */
export class PasswordWork {
  private active = 0;
  constructor(private concurrency = 4) {}
  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.active >= this.concurrency) throw Error('rateLimited');
    this.active++;
    try {
      return await operation();
    } finally {
      this.active--;
    }
  }
}
export const passwordWork = new PasswordWork();
