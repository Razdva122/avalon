/** This application owns a dedicated LiveKit instance. A new backend process
 * must retire all old media before replacing its in-memory admission registry. */
export class VoiceStartup {
  ready = false;
  private running = false;
  private generation = 0;
  constructor(
    private media: { listRooms(): Promise<{ name: string }[]>; deleteRoom(name: string): Promise<unknown> },
  ) {}
  reset() {
    this.ready = false;
    this.generation++;
  }
  async reconcile() {
    if (this.ready || this.running) return;
    this.running = true;
    const generation = this.generation;
    try {
      for (const room of await this.media.listRooms()) await this.media.deleteRoom(room.name);
      if (generation === this.generation) this.ready = true;
    } catch {
      // Health stays unavailable. No exception text: upstream may include credentials.
      console.error('Voice startup cleanup failed; admissions remain disabled');
    } finally {
      this.running = false;
    }
  }
}
