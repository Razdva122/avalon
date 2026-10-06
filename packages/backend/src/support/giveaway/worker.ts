import { GiveawayService } from './service';
export function startGiveawayWorker(service: GiveawayService): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const run = async () => {
    try {
      for (let i = 0; i < 10 && !stopped; i++) if (!(await service.processOne())) break;
    } catch {
      console.warn('Weekly Premium giveaway unavailable; retrying later.');
    }
    if (!stopped) {
      timer = setTimeout(() => void run(), 15000);
      timer.unref();
    }
  };
  void run();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
