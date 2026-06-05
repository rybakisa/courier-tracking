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
    slug: 'api',
    num: '02',
    title: 'API',
    subtitle: 'Выбор REST/GraphQL/gRPC по потокам, контракты, OpenAPI/Swagger',
    file: '02_api.md',
    status: 'done',
  },
  {
    slug: 'calculations',
    num: '03',
    title: 'Расчёты',
    subtitle: 'RPS, объём хранилища, throughput, fan-out и сайзинг серверов',
    file: '03_calculations.md',
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
    subtitle: 'Каталог паттернов под требования: горячий/холодный путь, durable-лог, pub/sub, OLAP, in-memory, tiering, кластеризация',
    file: '05_patterns.md',
    status: 'done',
  },
  {
    slug: 'monitoring',
    num: '06',
    title: 'Мониторинг',
    subtitle: 'Базовая наблюдаемость (4GS, три столпа, SLO/бюджет) и привязка метрик к требованиям FR/NFR',
    file: '06_monitoring.md',
    status: 'done',
  },
  {
    slug: 'limitations',
    num: '07',
    title: 'Ограничения',
    subtitle: 'Отложенные решения, компромиссы и сквозные вопросы контракта API',
    file: '07_limitations.md',
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
  FR3: 'Все курьеры в текущей области карты с онлайн-обновлением (оператор)',
  FR4: 'Просмотр полного маршрута курьера за сегодня (оператор)',
  FR5: 'Просмотр истории перемещений курьера за прошедшие дни (оператор)',
  NFR1: 'Свежесть: клиент — суб-секунда, оператор — ≤1 мин (потолок SLA); история к задержке не критична',
  NFR2: 'Durability: приём lossless (ack после лога); годовой архив — по настраиваемой гранулярности (≈1/мин база, детальнее на доставке)',
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

/** Карта «номер артефакта» → slug (для кросс-ссылок вида «артефакт 05 §3»). */
const NUM_TO_SLUG: Record<string, string> = {};
for (const a of artifacts) NUM_TO_SLUG[a.num] = a.slug;

const pad2 = (n: string): string => (n.length < 2 ? `0${n}` : n);

/**
 * Делает ссылки на разделы «§N» кликабельными. Сначала проставляет id=`s{N}` заголовкам
 * верхнего уровня (`# N. …` → `<h1 id="sN">`), затем превращает токены `§N` в ссылки:
 *  • «артефакт NN §M» / «(NN §M)» / «расчёты, §M» → раздел нужного артефакта (`/artifacts/{slug}#sM`);
 *  • голый «§N» → раздел текущей страницы (`#sN`), но только если такой раздел на ней есть
 *    (иначе остаётся обычным текстом — без битых якорей).
 * Содержимое блоков `<pre>` не трогаем (как в linkRequirementRefs).
 */
function linkSectionRefs(html: string, currentSlug: string | undefined): string {
  const present = new Set<string>();
  const withAnchors = html.replace(/<h1>(\d+)\./g, (_m: string, n: string) => {
    present.add(n);
    return `<h1 id="s${n}">${n}.`;
  });

  const re =
    /(?:(артефакт[а-яё]*)\s+(\d{1,2})\s*|(расчёт[а-яё]*),?\s*|(\d{1,2})\s+)?§(\d+)/g;
  const transform = (text: string): string =>
    text.replace(
      re,
      (match: string, _art: string, artNum: string, calcWord: string, bareNum: string, sec: string) => {
        const hasIndicator = Boolean(artNum || calcWord || bareNum);
        let slug: string | undefined;
        if (artNum) slug = NUM_TO_SLUG[pad2(artNum)];
        else if (calcWord) slug = 'calculations';
        else if (bareNum) slug = NUM_TO_SLUG[pad2(bareNum)];
        if (hasIndicator) {
          return slug
            ? `<a class="sec-ref" href="/artifacts/${slug}#s${sec}">${match}</a>`
            : match;
        }
        if (currentSlug && present.has(sec)) {
          return `<a class="sec-ref" href="#s${sec}">§${sec}</a>`;
        }
        return match;
      },
    );

  return withAnchors
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
  const slug = artifacts.find((a) => a.file === file)?.slug;
  const withReqs = linkRequirementRefs(html, file === '01_requirements.md');
  const withSecs = linkSectionRefs(withReqs, slug);
  return activateMermaidBlocks(withSecs);
}
