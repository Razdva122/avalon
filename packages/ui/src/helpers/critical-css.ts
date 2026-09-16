// The prerendered page can paint with inline CSS. Before activating dialogs,
// preferences or another route, wait for the complete shared stylesheets.
export function fullStylesReady(): Promise<void[]> {
  return Promise.all(
    Array.from(document.querySelectorAll<HTMLLinkElement>('link[data-critical-css="pending"]')).map(
      (link) =>
        new Promise<void>((resolve) => {
          const done = () => {
            link.removeEventListener('load', done);
            link.removeEventListener('error', done);
            resolve();
          };
          link.addEventListener('load', done);
          link.addEventListener('error', done);
        }),
    ),
  );
}
