// Cache in-flight requests as well as completed dictionaries. Failed chunks
// are evicted so a later selection can retry after the network recovers.
export function createMessageLoader<L extends string, M>(
  loaders: Record<L, () => Promise<M>>,
  install: (language: L, messages: M) => void,
) {
  const requests = new Map<L, Promise<void>>();
  function load(language: L): Promise<void> {
    const existing = requests.get(language);
    if (existing) return existing;
    const request = loaders[language]()
      .then((messages) => install(language, messages))
      .catch((error) => {
        requests.delete(language);
        throw error;
      });
    requests.set(language, request);
    return request;
  }
  return (language: L) => Promise.all([load('en' as L), load(language)]).then(() => undefined);
}

export function createLanguageSelection<L>(load: (language: L) => Promise<void>, apply: (language: L) => void) {
  let choice = 0;
  const commit = (language: L) => {
    choice++;
    apply(language);
  };
  const select = async (language: L) => {
    const request = ++choice;
    await load(language);
    if (request !== choice) return false;
    commit(language);
    return true;
  };
  return { select, commit };
}
