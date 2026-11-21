// Streamed into the live backend container by deploy.py.
async function checkIdle() {
  try {
    const response = await fetch('http://127.0.0.1:3000/internal/deploy/rooms', {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw Error('Room inventory unavailable');
    const { activeRooms } = await response.json();
    if (!Array.isArray(activeRooms) || !activeRooms.every((id) => typeof id === 'string' && id.trim())) {
      throw Error('Invalid room inventory');
    }
    return { exitCode: activeRooms.length ? 3 : 0, activeRooms };
  } catch {
    return { exitCode: 2, reason: 'Could not verify the full live room inventory', activeRooms: [] };
  }
}

void checkIdle().then((decision) => {
  console.log(JSON.stringify(decision));
  process.exitCode = decision.exitCode;
});
