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
            The Sovereign AI Layer
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            Your Knowledge.<br />
            <span className={styles.gradientText}>Your Rules.</span><br />
            <span className={styles.outlinedText}>Your Chain.</span>
          </Heading>
          <p className={styles.heroVision}>
            VIVIM is the <strong>first sovereign foundational layer</strong> for AI content—building a user-owned knowledge graph distributed on your personal blockchain.
          </p>
          <p className={styles.heroSubtitle}>
            Reclaim ownership of your AI interactions. Build your second brain. Control your digital destiny.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>930+</span>
              <span className={styles.statLabel}>Features Built</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>88%</span>
              <span className={styles.statLabel}>Platform Complete</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>4</span>
              <span className={styles.statLabel}>Core Packages</span>
            </div>
          </div>
          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/introduction"
              style={{marginRight: '1rem'}}>
              🔮 Join the Movement
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/ROADMAP/FEATURE_ROADMAP">
              📊 View Roadmap
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
        <Heading as="h2" className={styles.sectionTitle}>Why VIVIM Exists</Heading>
        <p className={styles.sectionSubtitle}>The world is generating knowledge through AI. Who owns it?</p>
        
        <div className={styles.pillarGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🏛️</div>
            <Heading as="h3">Sovereign Infrastructure</Heading>
            <p>The first foundational layer that puts <strong>you</strong> at the center of the AI revolution. Not the corporations. Not the platforms. <strong>You.</strong></p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🔗</div>
            <Heading as="h3">User-Owned Blockchain</Heading>
            <p>Every interaction, every memory, every insight—cryptographically secured on <strong>your personal blockchain</strong>. Transferable. Verifiable. Yours.</p>
          </div>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>🌐</div>
            <Heading as="h3">Distributed & Decentralized</Heading>
            <p>No central servers. No data silos. Pure P2P architecture with CRDT synchronization. <strong>Your data goes where you go.</strong></p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TheProblem() {
  return (
    <section className={styles.problemSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>The Current State of AI</Heading>
        <div className={styles.problemGrid}>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>01</div>
            <Heading as="h4">Your Knowledge, Their Servers</Heading>
            <p>Every prompt you send to ChatGPT, Claude, or Gemini lives on <em>their</em> infrastructure. You're just renting access.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>02</div>
            <Heading as="h4">Context Windows Expire</Heading>
            <p>60K tokens. 200K tokens. It doesn't matter—the window eventually closes. Your knowledge evaporates.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>03</div>
            <Heading as="h4">No Portability</Heading>
            <p>You can't export your AI memory. Can't transfer it. Can't sell it. You're locked in forever.</p>
          </div>
          <div className={styles.problemCard}>
            <div className={styles.problemNumber}>04</div>
            <Heading as="h4">They Profit, You Don't</Heading>
            <p>Your interactions train their models. Your knowledge improves their AI. They benefit, you get nothing.</p>
          </div>
        </div>
        <div className={styles.solutionCallout}>
          <Heading as="h3">VIVIM changes this equation.</Heading>
          <p>We built the infrastructure for <strong>user-owned AI memory</strong>. Your knowledge, monetized on your terms.</p>
        </div>
      </div>
    </section>
  );
}

function TechStack() {
  return (
    <section className={styles.techSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Built on Sovereign Tech</Heading>
        <p className={styles.sectionSubtitle}>Every component designed for ownership, privacy, and decentralization</p>
        
        <div className={styles.techGrid}>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>📱</div>
            <h4>PWA Frontend</h4>
            <p>React + TypeScript with offline-first architecture. 250+ features. 92% complete.</p>
            <Link to="/docs/pwa/overview">Explore →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>🌐</div>
            <h4>Network Engine</h4>
            <p>LibP2P + CRDT + DHT. P2P sync with no central servers. 78% complete.</p>
            <Link to="/docs/network/overview">Explore →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>🔧</div>
            <h4>Server API</h4>
            <p>Express + Bun + Prisma. 300+ endpoints. 93% complete.</p>
            <Link to="/docs/api/overview">Explore →</Link>
          </div>
          <div className={styles.techCard}>
            <div className={styles.techIcon}>📦</div>
            <h4>SDK Core</h4>
            <p>TypeScript SDK for building VIVIM-compatible apps. 83% complete.</p>
            <Link to="/docs/sdk/overview">Explore →</Link>
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
        <p>Join the movement to reclaim digital sovereignty. Your knowledge is valuable. Keep it that way.</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started/introduction">
            🚀 Start Building
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/ATOMIC_FEATURE_INVENTORY">
            💎 View Features
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
      description="VIVIM is the first sovereign foundational layer for AI content—building a user-owned knowledge graph distributed on your personal blockchain.">
      <HeroSection />
      <main>
        <VisionPillars />
        <TheProblem />
        <TechStack />
        <RoadmapPreview />
        <CTASection />
      </main>
    </Layout>
  );
}
