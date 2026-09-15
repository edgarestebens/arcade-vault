'use client'

import Link from 'next/link'
import {
  GAMES,
  HOME_FEATURES,
  HOME_STATS,
  HOME_ACTIVITY,
  HOME_TOP_TODAY,
  HOME_FAQS,
  HOME_PRICING_BENEFITS,
} from './data'
import { FloatingSilhouettes } from './components/FloatingSilhouettes'
import { FeatureIcon } from './components/FeatureIcon'
import { MiniCard } from './components/MiniCard'
import { useReveal } from './hooks/useReveal'

export default function Home() {
  useReveal()

  return (
    <div className="home fade-in">
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <Link href="/biblioteca" className="btn xl pulse">
              ▶  EXPLORAR JUEGOS
            </Link>
            <Link href="/auth" className="btn xl magenta">
              ✦  CREAR CUENTA
            </Link>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule" />
        </div>
        <div className="feature-grid">
          {HOME_FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`feature-card ${f.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule" />
        </div>
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/biblioteca" className="btn lg">
            VER TODOS LOS JUEGOS →
          </Link>
        </div>
      </section>

      <section className="home-stats reveal">
        <div className="stats-inner">
          {HOME_STATS.map((st, i) => (
            <div key={st.unit} className="stat-block" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="stat-n neon-yellow">{st.value}</div>
              <div className="stat-u pixel">{st.unit}</div>
              <div className="stat-s">{st.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule" />
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {HOME_ACTIVITY.map((r, i) => (
                <div key={`${r.player}-${r.game}`} className="tick-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`tk-p neon-${r.color}`}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">+{r.score.toLocaleString('es-ES')}</span>
                  <span className="tk-t">{r.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
              <Link href="/hall-of-fame" className="lb-link">
                VER SALÓN →
              </Link>
            </div>
            <div className="top-list">
              {HOME_TOP_TODAY.map((r, i) => (
                <div
                  key={r.player}
                  className={`top-row${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}
                >
                  <span className="tp-rk">#{String(r.rank).padStart(2, '0')}</span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">{r.score.toLocaleString('es-ES')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">// 04</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule" />
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              {HOME_PRICING_BENEFITS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/auth" className="btn xl pulse" style={{ width: '100%' }}>
              EMPEZAR GRATIS →
            </Link>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            {HOME_FAQS.map((faq) => (
              <div key={faq.q} className="faq-item">
                <div className="faq-q pixel">{faq.q}</div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <Link href="/biblioteca" className="btn xl pulse final-cta">
          INSERTAR MONEDA →
        </Link>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>
    </div>
  )
}
