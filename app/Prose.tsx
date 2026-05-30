'use client';

import { useEffect, useRef } from 'react';

/**
 * Рендерит HTML артефакта и поднимает Mermaid-диаграммы на клиенте.
 *
 * Блоки ```mermaid ещё на сервере (lib/artifacts.ts) превращены в <div class="mermaid">;
 * здесь они отрисовываются в SVG после монтирования. Mermaid обращается к DOM, поэтому
 * библиотека грузится динамически и только в браузере — как SwaggerUI на странице API.
 */
export default function Prose({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>('.mermaid:not([data-processed="true"])'),
    );
    if (nodes.length === 0) return;

    let cancelled = false;
    (async () => {
      const mermaid = (await import('mermaid')).default;
      if (cancelled) return; // StrictMode: первый прогон отменяется во время await
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: { fontFamily: 'system-ui, -apple-system, sans-serif' },
      });
      try {
        await mermaid.run({ nodes });
      } catch (err) {
        console.error('Mermaid render failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [html]);

  return <div className="prose" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
