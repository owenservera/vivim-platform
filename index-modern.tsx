import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import {motion} from 'framer-motion';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 30}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.8}}
          className={styles.heroContent}>
          
          <motion.div
            initial={{scale: 0.9, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{delay: 0.2, duration: 0.5}}
            className={styles.heroBadge}>
            <span className={styles.badgeDot}></span>
            Open Source SDK
          </motion.div>
          
          <motion.h1
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.3, duration: 0.8}}
            className={styles.heroTitle}>
            VIVIM <span className={styles.heroAccent}>SDK</span>
          </motion.h1>
          
          <motion.p
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.4, duration: 0.8}}
            className={styles.heroSubtitle}>
            Open-Source E2E Self-Contained Toolkit for Decentralized Applications
          </motion.p>
          
          <motion.p
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.5, duration: 0.8}}
            className={styles.heroTagline}>
            Build decentralized, AI-native, local-first applications with powerful P2P networking, 
            distributed storage, and identity management.
          </motion.p>
          
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.6, duration: 0.8}}
            className={styles.heroStats}>
            <motion.div 
              className={styles.stat}
              whileHover={{scale: 1.05}}
              transition={{type: 'spring', stiffness: 300}}>
              <span className={styles.statNumber}>13+</span>
              <span className={styles.statLabel}>Core Modules</span>
            </motion.div>
            <motion.div 
              className={styles.stat}
              whileHover={{scale: 1.05}}
              transition={{type: 'spring', stiffness: 300}}>
              <span className={styles.statNumber}>8+</span>
              <span className={styles.statLabel}>API Nodes</span>
            </motion.div>
            <motion.div 
              className={styles.stat}
              whileHover={{scale: 1.05}}
              transition={{type: 'spring', stiffness: 300}}>
              <span className={styles.statNumber}>10+</span>
              <span className={styles.statLabel}>Applications</span>
            </motion.div>
            <motion.div 
              className={styles.stat}
              whileHover={{scale: 1.05}}
              transition={{type: 'spring', stiffness: 300}}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Open Source</span>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.7, duration: 0.8}}
            className={styles.buttons}>
            <Link
              className={clsx('button', 'button--primary', 'button--lg', styles.heroButton)}
              to="/docs/sdk/overview">
              📦 Explore SDK
            </Link>
            <Link
              className={clsx('button', 'button--secondary', 'button--lg', styles.heroButton)}
              to="/docs/getting-started/introduction">
              ⚡ Quick Start
            </Link>
            <Link
              className={clsx('button', 'button--outline', 'button--lg', styles.heroButton)}
              to="https://github.com/vivim/vivim-sdk"
              target="_blank">
              🐙 GitHub
            </Link>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Animated background elements */}
      <div className={styles.heroBackground}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.heroParticle}
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
              opacity: 0,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
            }}
          />
        ))}
      </div>
    </header>
  );
}

function VisionSection() {
  const visionItems = [
    {
      icon: '🌐',
      title: 'Decentralized by Design',
      description: 'No central servers. No single point of control. Your data lives on your devices, synchronized peer-to-peer.',
      color: '#a65bf0',
    },
    {
      icon: '🔐',
      title: 'Sovereign Privacy',
      description: 'End-to-end encryption with your keys. Zero-knowledge architecture. You own everything.',
      color: '#0ea5e9',
    },
    {
      icon: '🧠',
      title: 'AI-Native Architecture',
      description: 'Built from the ground up for AI applications. Memory, context, and agent loops as first-class primitives.',
      color: '#f59e0b',
    },
    {
      icon: '⚡',
      title: 'Local-First Performance',
      description: 'Works offline. Syncs when online. Optimized for edge execution with Bun runtime.',
      color: '#10b981',
    },
  ];

  return (
    <section className={styles.visionSection}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 30}}
          whileInView={{opacity: 1, y: 0}}
          transition={{duration: 0.6}}
          viewport={{once: true}}
          className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Vision</h2>
          <p className={styles.sectionSubtitle}>
            A new paradigm for decentralized AI applications
          </p>
        </motion.div>
        
        <div className={styles.visionGrid}>
          {visionItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{opacity: 0, y: 30}}
              whileInView={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: index * 0.1}}
              viewport={{once: true}}
              whileHover={{y: -5, scale: 1.02}}
              className={styles.visionCard}
              style={{borderColor: item.color}}>
              <div 
                className={styles.visionIcon}
                style={{background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`}}>
                {item.icon}
              </div>
              <h3 className={styles.visionTitle}>{item.title}</h3>
              <p className={styles.visionDescription}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const layers = [
    {
      name: 'Applications',
      items: ['ACU Processor', 'OmniFeed', 'Circle Engine', 'Assistant', 'AI Documentation'],
      color: '#a65bf0',
    },
    {
      name: 'API Nodes',
      items: ['Identity', 'Storage', 'Memory', 'AI Chat', 'Content', 'Social'],
      color: '#0ea5e9',
    },
    {
      name: 'SDK Core',
      items: ['VivimSDK', 'RecordKeeper', 'Anchor Protocol', 'Self-Design', 'Assistant Runtime'],
      color: '#f59e0b',
    },
    {
      name: 'Network',
      items: ['P2P Engine', 'Sync Protocol', 'Exit Node', 'DHT', 'GossipSub'],
      color: '#10b981',
    },
    {
      name: 'Infrastructure',
      items: ['IPFS', 'Filecoin', 'SQLite', 'Chain of Trust'],
      color: '#ef4444',
    },
  ];

  return (
    <section className={styles.architectureSection}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 30}}
          whileInView={{opacity: 1, y: 0}}
          transition={{duration: 0.6}}
          viewport={{once: true}}
          className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Architecture Overview</h2>
          <p className={styles.sectionSubtitle}>
            Modular layers working in harmony
          </p>
        </motion.div>
        
        <div className={styles.archStack}>
          {layers.map((layer, index) => (
            <motion.div
              key={index}
              initial={{opacity: 0, x: -50}}
              whileInView={{opacity: 1, x: 0}}
              transition={{duration: 0.5, delay: index * 0.1}}
              viewport={{once: true}}
              className={styles.archLayer}
              style={{borderLeftColor: layer.color}}>
              <h3 
                className={styles.archLayerName}
                style={{color: layer.color}}>
                {layer.name}
              </h3>
              <div className={styles.archItems}>
                {layer.items.map((item, i) => (
                  <span key={i} className={styles.archItem}>{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{opacity: 0, y: 20}}
          whileInView={{opacity: 1, y: 0}}
          transition={{duration: 0.6, delay: 0.5}}
          viewport={{once: true}}
          className={styles.archLink}>
          <Link to="/docs/sdk/architecture/data-flow">
            View detailed architecture diagrams →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function QuickLinksSection() {
  const links = [
    {
      category: 'Getting Started',
      icon: '🚀',
      items: [
        {label: 'Introduction', href: '/docs/sdk/overview'},
        {label: 'Quick Start', href: '/docs/getting-started/introduction'},
        {label: 'Installation', href: '/docs/getting-started/introduction#installation'},
      ],
    },
    {
      category: 'Core SDK',
      icon: '🔧',
      items: [
        {label: 'SDK Overview', href: '/docs/sdk/core/overview'},
        {label: 'Communication Protocol', href: '/docs/sdk/core/communication'},
        {label: 'Self-Design Module', href: '/docs/sdk/core/self-design'},
      ],
    },
    {
      category: 'API Nodes',
      icon: '🔌',
      items: [
        {label: 'Identity Node', href: '/docs/sdk/api-nodes/overview#identity-node'},
        {label: 'Storage Node', href: '/docs/sdk/api-nodes/overview#storage-node'},
        {label: 'Memory Node', href: '/docs/sdk/api-nodes/overview#memory-node'},
      ],
    },
    {
      category: 'Development',
      icon: '💻',
      items: [
        {label: 'CLI Reference', href: '/docs/sdk/cli/overview'},
        {label: 'Extension System', href: '/docs/sdk/extension/overview'},
        {label: 'Testing Guide', href: '/docs/sdk/guides/testing'},
      ],
    },
  ];

  return (
    <section className={styles.quickLinksSection}>
      <div className="container">
        <motion.div
          initial={{opacity: 0, y: 30}}
          whileInView={{opacity: 1, y: 0}}
          transition={{duration: 0.6}}
          viewport={{once: true}}
          className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Quick Links</h2>
          <p className={styles.sectionSubtitle}>
            Jump to what you need
          </p>
        </motion.div>
        
        <div className={styles.linksGrid}>
          {links.map((section, index) => (
            <motion.div
              key={index}
              initial={{opacity: 0, y: 30}}
              whileInView={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: index * 0.1}}
              viewport={{once: true}}
              whileHover={{y: -3}}
              className={styles.linkCard}>
              <div className={styles.linkCardHeader}>
                <span className={styles.linkCardIcon}>{section.icon}</span>
                <h3 className={styles.linkCardTitle}>{section.category}</h3>
              </div>
              <ul className={styles.linkList}>
                {section.items.map((item, i) => (
                  <li key={i}>
                    <Link to={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </motion.div>
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
        <motion.div
          initial={{opacity: 0, scale: 0.95}}
          whileInView={{opacity: 1, scale: 1}}
          transition={{duration: 0.6}}
          viewport={{once: true}}
          className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to build the future?</h2>
          <p className={styles.ctaDescription}>
            Start building decentralized, AI-native applications with VIVIM SDK.
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className={clsx('button', 'button--primary', 'button--lg', styles.ctaButton)}
              to="/docs/getting-started/introduction">
              ⚡ Get Started
            </Link>
            <Link
              className={clsx('button', 'button--outline', 'button--lg', styles.ctaButton)}
              to="https://github.com/vivim/vivim-sdk"
              target="_blank">
              🐙 View on GitHub
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="VIVIM SDK - Decentralized AI Toolkit"
      description="Open-source E2E self-contained toolkit for building decentralized, AI-native applications.">
      <HomepageHeader />
      <main>
        <VisionSection />
        <ArchitectureSection />
        <QuickLinksSection />
        <CTASection />
      </main>
    </Layout>
  );
}
