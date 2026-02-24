import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Highly Parallel Execution',
    description: (
      <>
        Zero-blocking data retrieval. The <code>ParallelContextPipeline</code> queries internal memory, 
        vector chunks, and API resources natively via Promise.all structures alongside Concurrency Limiters.
      </>
    ),
  },
  {
    title: 'Streaming By Default',
    description: (
      <>
        Utilize native Async Generators to stream data downstream via <code>StreamingContextChunk</code> 
        models. Decrease perceived Time To First Token drastically.
      </>
    ),
  },
  {
    title: 'Strict User Isolation',
    description: (
      <>
        Total privacy constraint with the <code>UserContextSystem</code> handling siloed internal 
        SQLite instances for specific embedding spaces per human user logic. 
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCard)}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
