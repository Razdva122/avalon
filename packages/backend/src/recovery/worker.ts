import { RecoveryService } from './service';

export function startMailWorker(service: RecoveryService) {
  let running = false;
  let nextCleanupAt = 0;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (Date.now() >= nextCleanupAt) {
        await service.repository.cleanup(new Date());
        nextCleanupAt = Date.now() + 60000;
      }
      for (let i = 0; i < 10; i++) if (!(await service.deliverOne())) break;
    } catch {
      console.error('mail_worker_failed');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => {
    void tick();
  }, 5000);
  timer.unref();
  void tick();
  return () => clearInterval(timer);
}
