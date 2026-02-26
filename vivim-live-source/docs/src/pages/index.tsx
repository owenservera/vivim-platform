import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🚀 Open Source</div>
          <Heading as="h1" className={styles.heroTitle}>
            VIVIM
          </Heading>
          <p className={styles.heroSubtitle}>
            Your Personal AI Memory Platform
          </p>
          <p className={styles.heroTagline}>
            Capture. Remember. Connect. Own your AI conversations forever.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>10K+</span>
              <span className={styles.statLabel}>Conversations Captured</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>8+</span>
              <span className={styles.statLabel}>AI Providers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>E2E Encrypted</span>
            </div>
          </div>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/introduction"
              style={{marginRight: '1rem'}}>
              ⚡ Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/architecture/overview">
              🏗️ Architecture
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Feature({title, description, icon, link}: {title: string; description: string; icon: string; link: string}) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureCardLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The Problem with AI</Heading>
        <p className={styles.sectionSubtitle}>Why we built VIVIM</p>
        <div className="row">
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>🔒</div>
              <Heading as="h4">Locked Away</Heading>
              <p>AI providers store your conversations. You can't access, search, or use them outside their platforms.</p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>⏰</div>
              <Heading as="h4">Ephemeral</Heading>
              <p>Chat histories disappear. Context windows are limited. Your knowledge vanishes.</p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>🏝️</div>
              <Heading as="h4">Siloed</Heading>
              <p>Your AI interactions exist in isolated silos. No connection between sessions.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className={styles.howItWorksSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>How It Works</Heading>
        <p className={styles.sectionSubtitle}>From capture to intelligent context</p>
        
        <div className={styles.flowDiagram}>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>📥</div>
            <h4>Capture</h4>
            <p>Import from ChatGPT, Claude, Gemini & more</p>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>🔐</div>
            <h4>Encrypt</h4>
            <p>E2E encryption, your keys, your data</p>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>🧠</div>
            <h4>Understand</h4>
            <p>Extract ACUs, entities, memories</p>
          </div>
          <div className={styles.flowArrow}>→</div>
          <div className={styles.flowStep}>
            <div className={styles.flowIcon}>⚡</div>
            <h4>Context</h4>
            <p>Build intelligent context for AI</p>
          </div>
        </div>
        
        <div className={styles.flowDetails}>
          <div className={styles.flowDetailCard}>
            <code>POST /api/v1/capture</code>
            <span>Import conversation</span>
          </div>
          <div className={styles.flowDetailCard}>
            <code>Yjs + CRDT</code>
            <span>Conflict-free sync</span>
          </div>
          <div className={styles.flowDetailCard}>
            <code>libp2p</code>
            <span>P2P networking</span>
          </div>
          <div className={styles.flowDetailCard}>
            <code>8 layers</code>
            <span>Context pipeline</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {title: 'End-to-End Encrypted', description: 'Your memories are encrypted. Only you can decrypt them with your keys.', icon: '🔐', link: '/docs/security/overview'},
    {title: 'P2P Decentralized', description: 'No central server stores your data. Sync directly between devices.', icon: '🌐', link: '/docs/network/overview'},
    {title: 'Offline-First', description: 'Works without internet. Sync when you are back online.', icon: '📴', link: '/docs/pwa/overview'},
    {title: 'Storage V2', description: 'Content-addressed DAG storage with cryptographic verification.', icon: '💾', link: '/docs/pwa/storage-v2'},
    {title: 'BYOK Support', description: 'Bring Your Own Key. Use your own API keys for privacy.', icon: '🔑', link: '/docs/pwa/byok'},
    {title: 'Context Pipeline', description: 'Hyper-optimized streaming context pipelines with 8 layers.', icon: '🧠', link: '/docs/architecture/context'},
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Core Features</Heading>
        <p className={styles.sectionSubtitle}>What makes VIVIM different</p>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitecturePreview() {
  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>System Architecture</Heading>
        <p className={styles.sectionSubtitle}>Built for scale, designed for privacy</p>
        
        <div className={styles.archGrid}>
          <div className={styles.archCard}>
            <div className={styles.archIcon}>📱</div>
            <h4>PWA Client</h4>
            <p>React, offline-first, IndexedDB</p>
            <Link to="/docs/pwa/overview">Learn more →</Link>
          </div>
          <div className={styles.archCard}>
            <div className={styles.archIcon}>🌐</div>
            <h4>P2P Network</h4>
            <p>libp2p, CRDT, DHT</p>
            <Link to="/docs/network/overview">Learn more →</Link>
          </div>
          <div className={styles.archCard}>
            <div className={styles.archIcon}>🧠</div>
            <h4>Context Engine</h4>
            <p>8-layer pipeline, ACUs</p>
            <Link to="/docs/architecture/context">Learn more →</Link>
          </div>
          <div className={styles.archCard}>
            <div className={styles.archIcon}>💿</div>
            <h4>Storage</h4>
            <p>DAG storage, content-addressed</p>
            <Link to="/docs/database/schema">Learn more →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <Heading as="h2">Ready to own your AI?</Heading>
        <p>Start capturing your AI conversations today.</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started/introduction">
            ⚡ Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/architecture/pipeline">
            🏗️ Context Pipeline
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="VIVIM - Your Personal AI Memory Platform"
      description="Capture, store, and interact with your AI conversations across multiple providers.">
      <HomepageHeader />
      <main>
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ArchitecturePreview />
        <CTASection />
      </main>
    </Layout>
  );
}
