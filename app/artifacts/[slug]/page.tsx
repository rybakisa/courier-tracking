import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { artifacts, getArtifact, renderArtifact } from '@/lib/artifacts';
import Prose from '@/app/Prose';

export function generateStaticParams() {
  return artifacts.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArtifact(params.slug);
  return {
    title: a
      ? `${a.num}. ${a.title} — Системный дизайн`
      : 'Артефакт не найден — Системный дизайн',
  };
}

export default function ArtifactPage({ params }: { params: { slug: string } }) {
  const artifact = getArtifact(params.slug);
  if (!artifact) notFound();

  const html = renderArtifact(artifact.file);
  const idx = artifacts.findIndex((a) => a.slug === artifact.slug);
  const prev = artifacts[idx - 1];
  const next = artifacts[idx + 1];

  return (
    <div className="doc-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Артефакты</div>
        <nav>
          {artifacts.map((a) => (
            <Link
              key={a.slug}
              href={`/artifacts/${a.slug}`}
              className={`sidebar-link${a.slug === artifact.slug ? ' active' : ''}`}
            >
              <span className="sidebar-num">{a.num}</span>
              <span className="sidebar-label">{a.title}</span>
              <span className={`dot ${a.status}`} aria-hidden />
            </Link>
          ))}
        </nav>
      </aside>

      <article className="content">
        <div className="content-head">
          {artifact.status !== 'done' && (
            <span className={`badge ${artifact.status}`}>В работе</span>
          )}
          <h1>
            {artifact.num}. {artifact.title}
          </h1>
        </div>

        <Prose html={html} />

        <nav className="pager">
          {prev ? (
            <Link href={`/artifacts/${prev.slug}`} className="pager-link">
              ← {prev.num}. {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/artifacts/${next.slug}`} className="pager-link right">
              {next.num}. {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </div>
  );
}
