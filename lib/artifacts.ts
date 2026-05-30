import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

export type ArtifactStatus = 'done' | 'todo';

export interface Artifact {
  slug: string;
  num: string;
  title: string;
  subtitle: string;
  file: string;
  status: ArtifactStatus;
}

/** Метаданные всех семи артефактов проектирования. Порядок задаёт навигацию. */
export const artifacts: Artifact[] = [
  {
    slug: 'requirements',
    num: '01',
    title: 'Требования',
    subtitle: 'Функциональные и нефункциональные требования, реконструкция сбора требований',
    file: '01_requirements.md',
    status: 'done',
  },
  {
    slug: 'calculations',
    num: '02',
    title: 'Расчёты',
    subtitle: 'RPS, объём хранилища, throughput, fan-out и сайзинг серверов',
    file: '02_calculations.md',
    status: 'done',
  },
  {
    slug: 'api',
    num: '03',
    title: 'API',
    subtitle: 'Выбор REST/GraphQL/gRPC по потокам, контракты, OpenAPI/Swagger',
    file: '03_api.md',
    status: 'done',
  },
  {
    slug: 'c4',
    num: '04',
    title: 'Схемы C4',
    subtitle: 'Context, Containers, Components',
    file: '04_c4.md',
    status: 'done',
  },
  {
    slug: 'patterns',
    num: '05',
    title: 'Архитектурные паттерны',
    subtitle: 'Разделение горячего и холодного пути, лог-ingestion, гео-индексы',
    file: '05_patterns.md',
    status: 'done',
  },
  {
    slug: 'scalability',
    num: '06',
    title: 'Масштабируемость',
    subtitle: 'Проблемы масштабирования и решения по ним',
    file: '06_scalability.md',
    status: 'done',
  },
  {
    slug: 'monitoring',
    num: '07',
    title: 'Мониторинг',
    subtitle: 'Метрики, алерты и SLO',
    file: '07_monitoring.md',
    status: 'done',
  },
];

export function getArtifact(slug: string): Artifact | undefined {
  return artifacts.find((a) => a.slug === slug);
}

/** Краткие формулировки требований — для тултипов и перелинковки упоминаний FR#/NFR#. */
const REQUIREMENTS: Record<string, string> = {
  FR1: 'Приём геопозиции от курьерского приложения',
  FR2: 'Real-time слежение клиентом за одним конкретным курьером',
  FR3: 'Все курьеры в текущей области карты с онлайн-обновлением (диспетчер)',
  FR4: 'Просмотр полного маршрута курьера за сегодня (диспетчер)',
  FR5: 'Просмотр истории перемещений курьера за прошедшие дни (диспетчер)',
  NFR1: 'Доступность: 1 мин — жёсткий потолок SLA, клиентский флоу — как можно быстрее',
  NFR2: 'Durability: глубина 1 год, ingestion durable, точки не теряются',
  NFR3: 'Согласованность: eventual для живых позиций, история — полная и непротиворечивая',
  NFR4: 'Геораспределённость: несколько регионов, континентов и часовых поясов',
  NFR5: 'Uptime: целевой ориентир 99.99% для клиентского флоу',
};

/**
 * Превращает упоминания FR#/NFR# (в т.ч. с дефисом, напр. «NFR-2») в ссылки с тултипом.
 * На странице требований токен становится id-якорем (первое вхождение), на остальных —
 * ссылкой на этот якорь. Содержимое блоков `<pre>` не трогаем.
 */
function linkRequirementRefs(html: string, isRequirementsPage: boolean): string {
  const seen = new Set<string>();
  const transform = (text: string): string =>
    text.replace(/\b(NFR|FR)-?([1-9])\b/g, (match: string, type: string, num: string) => {
      const key = `${type}${num}`;
      const desc = REQUIREMENTS[key];
      if (!desc) return match;
      const title = `${key} — ${desc}`.replace(/"/g, '&quot;');
      const anchor = key.toLowerCase();
      if (isRequirementsPage) {
        if (seen.has(key)) return `<a class="req-ref" href="#${anchor}" title="${title}">${match}</a>`;
        seen.add(key);
        return `<a class="req-ref" id="${anchor}" title="${title}">${match}</a>`;
      }
      return `<a class="req-ref" href="/artifacts/requirements#${anchor}" title="${title}">${match}</a>`;
    });

  return html
    .split(/(<pre[\s\S]*?<\/pre>)/g)
    .map((chunk) => (chunk.startsWith('<pre') ? chunk : transform(chunk)))
    .join('');
}

/**
 * Превращает блоки ```mermaid (marked рендерит их в `<pre><code class="language-mermaid">`)
 * в `<div class="mermaid">`, чтобы клиентский Mermaid отрисовал их в SVG (см. app/Prose.tsx).
 * Содержимое остаётся HTML-экранированным — браузер вернёт его раскодированным через textContent.
 * Запускается после linkRequirementRefs, который не трогает содержимое блоков `<pre>`.
 */
function activateMermaidBlocks(html: string): string {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_match, code: string) => `<div class="mermaid">${code}</div>`,
  );
}

/** Читает Markdown артефакта из корня репозитория и возвращает HTML. */
export function renderArtifact(file: string): string {
  const fullPath = path.join(process.cwd(), file);
  const md = fs.readFileSync(fullPath, 'utf-8');
  const html = marked.parse(md, { async: false, gfm: true }) as string;
  const linked = linkRequirementRefs(html, file === '01_requirements.md');
  return activateMermaidBlocks(linked);
}
