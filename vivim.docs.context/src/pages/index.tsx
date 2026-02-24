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
          <Heading as="h1" className={styles.heroTitle}>
            VIVIM
          </Heading>
          <p className={styles.heroSubtitle}>
            Your Personal AI Memory Platform
          </p>
          <p className={styles.heroTagline}>
            Capture. Remember. Connect. Own your AI conversations forever.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/introduction"
              style={{marginRight: '1rem'}}>
              Get Started
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/architecture/overview">
              Architecture
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Feature({title, description, icon}: {title: string; description: string; icon: string}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The Problem</Heading>
        <div className="row">
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>L</div>
              <Heading as="h4">Locked Away</Heading>
              <p>AI providers store your conversations. You can't access, search, or use them.</p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>E</div>
              <Heading as="h4">Ephemeral</Heading>
              <p>Chat histories disappear. Context windows are limited.</p>
            </div>
          </div>
          <div className="col col--4">
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>S</div>
              <Heading as="h4">Siloed</Heading>
              <p>Your AI interactions exist in isolated silos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {title: 'End-to-End Encrypted', description: 'Your memories are encrypted. Only you can decrypt them.', icon: '1'},
    {title: 'P2P Decentralized', description: 'No central server stores your data. Sync directly between devices.', icon: '2'},
    {title: 'Offline-First', description: 'Works without internet. Sync when you are back online.', icon: '3'},
    {title: 'Storage V2', description: 'Content-addressed DAG storage with cryptographic verification.', icon: '4'},
    {title: 'BYOK', description: 'Bring Your Own Key. Use your own API keys.', icon: '5'},
    {title: 'Context Pipeline', description: 'Hyper-optimized streaming context pipelines.', icon: '6'},
  ];

  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Core Features</Heading>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
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
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/architecture/pipeline">
            Context Pipeline
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
        <FeaturesSection />
        <CTASection />
      </main>
    </Layout>
  );
}
