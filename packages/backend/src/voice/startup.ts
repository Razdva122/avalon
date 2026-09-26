/** This application owns a dedicated LiveKit instance. A new backend process
 * must retire all old media before replacing its in-memory admission registry. */
export class VoiceStartup {
  ready = false;
  private running = false;
  constructor(
    private media: { listRooms(): Promise<{ name: string }[]>; deleteRoom(name: string): Promise<unknown> },
  ) {}
  async reconcile() {
    if (this.ready || this.running) return;
    this.running = true;
    try {
      for (const room of await this.media.listRooms()) await this.media.deleteRoom(room.name);
      this.ready = true;
    } catch {
      // Health stays unavailable. No exception text: upstream may include credentials.
      console.error('Voice startup cleanup failed; admissions remain disabled');
    } finally {
      this.running = false;
    }
  }
}
