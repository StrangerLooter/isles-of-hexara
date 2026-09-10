export class SocketRateLimiter {
  private actionTimestamps = new Map<string, number[]>();
  private chatTimestamps = new Map<string, number[]>();

  private cleanOld(timestamps: number[], windowMs: number, now: number): number[] {
    return timestamps.filter((t) => now - t < windowMs);
  }

  checkActionLimit(socketId: string, maxActions = 20, windowMs = 10000): boolean {
    const now = Date.now();
    const current = this.actionTimestamps.get(socketId) ?? [];
    const valid = this.cleanOld(current, windowMs, now);

    if (valid.length >= maxActions) {
      this.actionTimestamps.set(socketId, valid);
      return false;
    }

    valid.push(now);
    this.actionTimestamps.set(socketId, valid);
    return true;
  }

  checkChatLimit(socketId: string, maxChats = 5, windowMs = 10000): boolean {
    const now = Date.now();
    const current = this.chatTimestamps.get(socketId) ?? [];
    const valid = this.cleanOld(current, windowMs, now);

    if (valid.length >= maxChats) {
      this.chatTimestamps.set(socketId, valid);
      return false;
    }

    valid.push(now);
    this.chatTimestamps.set(socketId, valid);
    return true;
  }

  cleanup(socketId: string): void {
    this.actionTimestamps.delete(socketId);
    this.chatTimestamps.delete(socketId);
  }
}
