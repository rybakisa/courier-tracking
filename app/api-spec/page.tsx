'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'swagger-ui-react/swagger-ui.css';

// SwaggerUI трогает window — грузим только на клиенте.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p className="api-spec-loading">Загрузка спецификации…</p>,
});

export default function ApiSpecPage() {
  return (
    <div className="api-spec">
      <div className="api-spec-head">
        <Link href="/artifacts/api" className="api-spec-back">
          ← 02. API
        </Link>
        <h1>REST API — Swagger UI</h1>
        <p>
          Интерактивная спецификация REST-поверхности системы. Источник —{' '}
          <code>/openapi.yaml</code>. Realtime-потоки (WebSocket) описаны в артефакте API, §2–§4.
        </p>
      </div>
      <SwaggerUI url="/openapi.yaml" />
    </div>
  );
}
