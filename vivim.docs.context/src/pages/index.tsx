import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HeroSection() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroGlow} />
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.visionBadge}>
            <span className={styles.badgeDot} />
            The Sovereign AI Ecosystem
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            Tokenize Your Mind.<br />
            <span className={styles.gradientText}>Atomic Chat Units.</span><br />
            <span className={styles.outlinedText}>Open Data Highway.</span>
          </Heading>
          <p className={styles.heroVision}>
            VIVIM provides the <strong>ultimate SDK and foundational layer</strong> to build user-owned AI applications. Transform interactions into <strong>Atomic Chat Units (ACUs)</strong>—tokenized, local-first assets on a personal blockchain.
          </p>
          <p className={styles.heroSubtitle}>
            Build sovereign AI experiences where users own their data, context, and destiny.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>1 SDK</span>
              <span className={styles.statLabel}>Infinite Apps</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>User Owned</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>P2P</span>
              <span className={styles.statLabel}>Data Highway</span>
            </div>
          </div>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/sdk/overview"
              style={{marginRight: '1rem'}}>
              📦 Explore the SDK
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/getting-started/introduction">
              📖 Read the Docs
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function VisionPillars() {
  return (
    <section className={styles.visionSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The VIVIM Paradigm</Heading>
        <p className={styles.sectionSubtitle}>Moving from centralized silos to an open, tokenized AI data highway.</p>
        
        <div className={styles.pillarGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>💎</div>
            <Heading as="h3">Tokenization of ACUs</Heading>
            <p>Every interaction, insight, and memory is distilled into <strong>Atomic Chat Units (ACUs)</strong>—cryptographically secured tokens on your personal blockchain. Turn ephemeral chats into permanent, transferable assets.</p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🧩</div>
            <Heading as="h3">Sovereign Components</Heading>
            <p>A rich library of local-first, privacy-preserving UI and system components that snap together to create fully autonomous, user-centric AI applications.</p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🛣️</div>
            <Heading as="h3">Open Data Highway</Heading>
            <p>A decentralized P2P network powered by LibP2P and CRDTs. Seamlessly synchronize your tokenized knowledge graph across devices without central servers or corporate data brokers.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section className={styles.problemSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The "VIVIM Apps" Ecosystem</Heading>
        <p className={styles.sectionSubtitle} style={{textAlign: 'center', marginBottom: '2rem'}}>A growing suite of modular tools built on the unique VIVIM SDK.</p>
        <div className={styles.problemGrid}>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>✨</div>
            <Heading as="h4">Assistant-UI Toolkit</Heading>
            <p>Ready-to-use React components natively wired to the VIVIM backend. Build rich, context-aware AI chat interfaces in minutes while retaining strict local-first sovereignty.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>📥</div>
            <Heading as="h4">Universal Chat Importer</Heading>
            <p><em>(Coming Soon)</em> A bulk importing utility that ingests ChatGPT `.zip` exports and automatically tokenizes them into the user's sovereign local-first database, fully wired into the VIVIM architecture.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>🤝</div>
            <Heading as="h4">Social Sharing Primitives</Heading>
            <p>Decentralized sharing components allowing users to securely broadcast their tokenized AI memories via ActivityPub and Fediverse networks without losing ownership or encryption.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>🛠️</div>
            <Heading as="h4">The Unique VIVIM SDK</Heading>
            <p>The foundational layer powering it all. A comprehensive TypeScript SDK for managing MCP connections, distributed storage, and personal blockchain synchronization.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className={styles.techSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Powered by the VIVIM SDK</Heading>
        <p className={styles.sectionSubtitle}>Everything you need to build the next generation of AI apps</p>
        
        <div className={styles.techGrid}>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>📱</div>
            <h4>Local-First PWA Base</h4>
            <p>Offline-capable React architectures designed for true data ownership and seamless context injection.</p>
            <Link to="/docs/pwa/overview">Explore PWA →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>🌐</div>
            <h4>P2P Network Engine</h4>
            <p>Embedded LibP2P nodes allowing direct device-to-device CRDT synchronization.</p>
            <Link to="/docs/network/overview">Explore Network →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>🔧</div>
            <h4>Sovereign API</h4>
            <p>A unified backend service managing extraction, vectorization, and local embeddings.</p>
            <Link to="/docs/api/overview">Explore API →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>📦</div>
            <h4>Model Context Protocol</h4>
            <p>Native MCP integration ensuring AI models can securely access your personal knowledge graph.</p>
            <Link to="/docs/sdk/mcp/overview">Explore MCP →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapPreview() {
  return (
    <section className={styles.roadmapSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The Path to Sovereignty</Heading>
        <p className={styles.sectionSubtitle}>From Foundation to Full Decentralization</p>
        
        <div className={styles.roadmapTimeline}>
          <div className={styles.timelinePhase}>
            <div className={styles.phaseMarker}>✅</div>
            <div className={styles.phaseContent}>
              <h4>Phase 0: Genesis</h4>
              <span className={styles.phaseDate}>Jan - Mar 2025</span>
              <p>Foundation laid. 30 features delivered.</p>
            </div>
          </div>
          <div className={styles.timelinePhase}>
            <div className={styles.phaseMarker}>✅</div>
            <div className={styles.phaseContent}>
              <h4>Phase 1: Foundation</h4>
              <span className={styles.phaseDate}>Apr - Sep 2025</span>
              <p>Core platform built. 550 features delivered. 95% complete.</p>
            </div>
          </div>
          <div className={styles.timelinePhase}>
            <div className={styles.phaseMarker + ' ' + styles.activePhase}>🚧</div>
            <div className={styles.phaseContent}>
              <h4>Phase 2: Expansion</h4>
              <span className={styles.phaseDate}>Oct 2025 - Mar 2026</span>
              <p>SDK enhancements, advanced nodes, apps. 85% complete.</p>
            </div>
          </div>
          <div className={styles.timelinePhase}>
            <div className={styles.phaseMarker}>⏳</div>
            <div className={styles.phaseContent}>
              <h4>Phase 3: Decentralization</h4>
              <span className={styles.phaseDate}>Apr - Sep 2026</span>
              <p>Full federation, decentralized identity, governance.</p>
            </div>
          </div>
          <div className={styles.timelinePhase}>
            <div className={styles.phaseMarker}>🔮</div>
            <div className={styles.phaseContent}>
              <h4>Phase 4: Ecosystem</h4>
              <span className={styles.phaseDate}>Oct 2026 - 2027</span>
              <p>Developer ecosystem, enterprise features, global scale.</p>
            </div>
          </div>
        </div>
        
        <div className={styles.roadmapCTA}>
          <Link to="/docs/ROADMAP/FEATURE_ROADMAP" className="button button--primary button--lg">
            📋 Full Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaGlow} />
        <Heading as="h2">Own Your AI. Own Your Future.</Heading>
        <p>Join the movement to reclaim digital sovereignty. Build on the open data highway.</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started/introduction">
            🚀 Start Building
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/sdk/overview">
            📦 View the SDK
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="VIVIM - The Sovereign Foundation Layer for AI"
      description="VIVIM provides the ultimate SDK and foundational layer to build user-owned AI applications and tokenize chat histories on a personal blockchain.">
      <HeroSection />
      <main>
        <VisionPillars />
        <EcosystemSection />
        <TechStack />
        <RoadmapPreview />
        <CTASection />
      </main>
    </Layout>
  );
}
