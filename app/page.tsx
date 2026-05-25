import Link from 'next/link';
import { artifacts } from '@/lib/artifacts';

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <h1>Real-time система трекинга курьеров</h1>
        <p>
          Учебный проект по системному дизайну. Международный сервис доставки масштаба
          Amazon: живая карта курьеров, онлайн-обновления положения, маршрут за сегодня и
          история перемещений за год.
        </p>
        <p>Ниже — 7 артефактов проектирования, от сбора требований до мониторинга.</p>
      </section>

      <section className="brief">
        <h2>Задача</h2>
        <div className="brief-grid">
          <div>
            <h3>Функциональные требования</h3>
            <ul>
              <li>Карта с текущим положением всех курьеров в области</li>
              <li>Онлайн-обновление положения курьеров</li>
              <li>Маршрут курьера за сегодняшний день</li>
              <li>История перемещений за прошедшие дни</li>
            </ul>
          </div>
          <div>
            <h3>Нефункциональные требования</h3>
            <ul>
              <li>Хранение истории перемещений — 1 год</li>
              <li>Свежесть данных — суб-секундное ощущение (уточнено)</li>
              <li>Масштаб — ~300K курьеров онлайн на пике</li>
              <li>Геораспределённость — мульти-регион</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="section-label">Артефакты проектирования</p>
      <div className="cards">
        {artifacts.map((a) => (
          <Link key={a.slug} href={`/artifacts/${a.slug}`} className="card">
            <div className="card-top">
              <span className="card-num">АРТЕФАКТ {a.num}</span>
              <span className={`badge ${a.status}`}>
                {a.status === 'done' ? 'Готово' : 'В работе'}
              </span>
            </div>
            <h3>{a.title}</h3>
            <p>{a.subtitle}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
