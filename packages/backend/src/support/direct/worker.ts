import { DirectService } from './service';
export function startSupportWorker(service: DirectService): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const run = async () => {
    try {
      for (let i = 0; i < 10 && !stopped; i++) if (!(await service.processOne())) break;
    } catch {
      console.warn('Support worker unavailable; retrying later.');
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
