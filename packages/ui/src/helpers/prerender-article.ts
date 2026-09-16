import { nextTick, type App } from 'vue';
import { renderToString } from 'vue/server-renderer';

// Loaded only in the build renderer, never in a visitor's startup path.
export async function prerenderArticle(app: App, root: HTMLElement) {
  const context: { teleports?: Record<string, string> } = {};
  const html = await renderToString(app, context);
  root.innerHTML = html;
  for (const [selector, content] of Object.entries(context.teleports || {})) {
    const target = document.querySelector(selector);
    if (!target) throw new Error(`Missing prerender teleport target: ${selector}`);
    target.innerHTML = content;
  }

  // Exercise actual Vue hydration for every article during the build. In
  // particular, the already-painted headings/paragraphs must retain identity.
  // This catches browser HTML repairs (e.g. a div inside a paragraph) that
  // would otherwise silently turn hydration into a destructive remount.
  const contentNodes = [
    ...root.querySelectorAll(
      '.info-page-content h1, .info-page-content h2, .info-page-content h3, .info-page-content p',
    ),
  ];
  const content = contentNodes.map((node) => ({ node, firstChild: node.firstChild, text: node.textContent }));
  app.mount(root);
  await nextTick();
  if (
    content.some(
      ({ node, firstChild, text }) =>
        !root.contains(node) || node.firstChild !== firstChild || node.textContent !== text,
    )
  ) {
    throw new Error('Hydration replaced prerendered article content');
  }
  app.unmount();
  // Publish the initial SSR state, not post-mount dialogs or personalized UI.
  root.innerHTML = html;
  root.dataset.ssrPath = window.location.pathname;
}
