import { useEffect } from 'react';
import { ArrowDown, ArrowLeft, ArrowUpRight, BookOpen, Sprout } from 'lucide-react';
import { devlogChangelog, devlogDisclosure, devlogSections } from '@/content/devlogRegistry';
import './devlog.css';

const questions = [
  'How long should a day feel when there is time for both errands and a slow evening?',
  'Which farm tools or care actions would make the growing loop feel more satisfying?',
  'What kind of everyday routines would make the neighbors feel more like locals?',
];

function statusClass(status: string) {
  if (status === 'Verified Playable') return 'is-verified';
  if (status === 'In Development') return 'is-progress';
  return 'is-concept';
}

export default function Devlog() {
  useEffect(() => {
    const originalTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const originalDescription = description?.content;
    document.title = 'City Devlog | POTIFY: A Wonderful High Life';
    if (description) description.content = 'Spoiler-safe development notes for POTIFY: A Wonderful High Life, an original 3D neighborhood life-simulation game.';
    return () => {
      document.title = originalTitle;
      if (description && originalDescription) description.content = originalDescription;
    };
  }, []);

  return (
    <main className="devlog-page">
      <div className="devlog-grain" aria-hidden="true" />
      <header className="devlog-header">
        <a className="devlog-wordmark" href="/" aria-label="Return to POTIFY game">
          <span className="wordmark-mark"><Sprout size={17} strokeWidth={1.7} /></span>
          <span>POTIFY <i>field notes</i></span>
        </a>
        <a className="return-link feedback-nav" href="#feedback">
          Open questions <ArrowDown size={14} aria-hidden="true" />
        </a>
        <a className="return-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Return to the game</span>
          <ArrowUpRight size={14} className="return-out" aria-hidden="true" />
        </a>
      </header>

      <section className="devlog-hero" aria-labelledby="devlog-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-rule" /> A public development registry</p>
          <h1 id="devlog-title">A little city,<br /><em>still taking shape.</em></h1>
          <p className="hero-intro">
            Notes from the making of <strong>POTIFY: A Wonderful High Life</strong> — a quiet
            neighborhood life sim, shared in broad strokes and without the secrets.
          </p>
          <a className="browse-link" href="#registry">
            Browse the registry <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
        <div className="hero-art" aria-label="Illustrated rooftop and neighborhood skyline">
          <div className="sun-disc" />
          <div className="skyline skyline-back"><i /><i /><i /><i /></div>
          <div className="roofline">
            <span className="greenhouse"><i /><b /><b /><b /></span>
            <span className="roof-planter"><i /><i /><i /></span>
            <span className="roof-edge" />
          </div>
          <span className="art-caption">CANOPY QUARTER · FIELD NOTE 01</span>
          <span className="art-stamp">IN<br />PROGRESS</span>
        </div>
        <div className="hero-bottomline">
          <span>EARLY BUILD / PUBLIC NOTES</span>
          <span className="hero-scroll"><span /> Take a look around</span>
        </div>
      </section>

      <section className="registry-intro" id="registry" aria-labelledby="registry-heading">
        <div>
          <p className="eyebrow">The working map</p>
          <h2 id="registry-heading">18 parts of a<br />neighborhood life.</h2>
        </div>
        <div className="registry-intro-note">
          <BookOpen size={19} strokeWidth={1.5} aria-hidden="true" />
          <p>A selective public view, not the private world bible. Each note keeps its own ID and honest status.</p>
        </div>
      </section>

      <nav className="category-directory" aria-label="Registry categories">
        <div className="directory-label">Jump to a section <span>18 categories</span></div>
        <div className="directory-links">
          {devlogSections.map((section, index) => (
            <a key={section.id} href={`#section-${section.id}`}>
              <span className="directory-index">{String(index + 1).padStart(2, '0')}</span>
              <span>{section.title}</span>
              <span className="directory-code">{section.id}</span>
            </a>
          ))}
        </div>
      </nav>

      <section className="registry-list" aria-label="Development registry sections">
        {devlogSections.map((section, index) => (
          <article className="registry-section" id={`section-${section.id}`} key={section.id}>
            <div className="section-heading">
              <span className="section-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="section-code">{section.id} / REGISTRY ENTRY</p>
                <h3>{section.title}</h3>
              </div>
              <a className="section-top" href="#registry" aria-label={`Back to registry directory: ${section.title}`}>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="section-intro">{section.intro}</p>
            <div className="entry-list">
              {section.entries.map(entry => (
                <div className="registry-entry" key={entry.id}>
                  <span className="entry-id">{entry.id}</span>
                  <div className="entry-copy">
                    <h4>{entry.title}</h4>
                    <p>{entry.detail}</p>
                  </div>
                  <span className={`status-pill ${statusClass(entry.status)}`}>
                    <span className="status-dot" />{entry.status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="closing-notes" id="feedback">
        <div className="changelog-panel">
          <p className="eyebrow">One dated note</p>
          {devlogChangelog.map((item) => (
            <article className="changelog-entry" key={item.date}>
              <time dateTime={item.date}>{item.date}</time>
              <p className="changelog-version">{item.version}</p>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <span className={`status-pill ${statusClass(item.status)}`}>
                <span className="status-dot" />{item.status}
              </span>
            </article>
          ))}
        </div>
        <aside className="feedback-panel" aria-labelledby="feedback-title">
          <p className="eyebrow">Open questions / no form attached</p>
          <h2 id="feedback-title">What would you tune?</h2>
          <p className="feedback-lede">These are the useful conversations right now.</p>
          <ol>
            {questions.map((question, index) => <li key={question}><span>0{index + 1}</span>{question}</li>)}
          </ol>
          <p className="feedback-footnote">Prompts for discussion only. This page does not collect or submit feedback.</p>
        </aside>
      </section>

      <footer className="devlog-footer">
        <div className="footer-top">
          <a className="footer-return" href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to POTIFY</a>
          <span className="footer-mark">A WONDERFUL HIGH LIFE <i>·</i> PUBLIC NOTES</span>
        </div>
        <p className="disclosure">{devlogDisclosure}</p>
        <div className="planning-counts">
          <p><strong>469</strong><span>world-bible planning entries</span><small>User-provided planning count · not shipped software features</small></p>
          <p><strong>51</strong><span>discovery ideas in the private plan</span><small>User-provided planning count · not shipped software features</small></p>
        </div>
        <p className="footer-bottom">Selective notes only. Unreleased details stay private.</p>
      </footer>
    </main>
  );
}
