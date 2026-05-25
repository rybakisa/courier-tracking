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
    subtitle: 'Контракты приёма пинга, подписок и чтения истории',
    file: '03_api.md',
    status: 'todo',
  },
  {
    slug: 'c4',
    num: '04',
    title: 'Схемы C4',
    subtitle: 'Context, Containers, Components',
    file: '04_c4.md',
    status: 'todo',
  },
  {
    slug: 'patterns',
    num: '05',
    title: 'Архитектурные паттерны',
    subtitle: 'Разделение горячего и холодного пути, лог-ingestion, гео-индексы',
    file: '05_patterns.md',
    status: 'todo',
  },
  {
    slug: 'scalability',
    num: '06',
    title: 'Масштабируемость',
    subtitle: 'Проблемы масштабирования и решения по ним',
    file: '06_scalability.md',
    status: 'todo',
  },
  {
    slug: 'monitoring',
    num: '07',
    title: 'Мониторинг',
    subtitle: 'Метрики, алерты и SLO',
    file: '07_monitoring.md',
    status: 'todo',
  },
];

export function getArtifact(slug: string): Artifact | undefined {
  return artifacts.find((a) => a.slug === slug);
}

/** Читает Markdown артефакта из корня репозитория и возвращает HTML. */
export function renderArtifact(file: string): string {
  const fullPath = path.join(process.cwd(), file);
  const md = fs.readFileSync(fullPath, 'utf-8');
  return marked.parse(md, { async: false, gfm: true }) as string;
}
