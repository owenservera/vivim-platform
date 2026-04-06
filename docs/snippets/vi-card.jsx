export function ViCard({ title, icon, description }) {
  return (
    <div style={{
      border: '1px solid var(--mint-border)',
      borderRadius: '12px',
      padding: '20px 24px',
      marginBottom: '24px',
      background: 'var(--mint-card-bg)',
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--mint-text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}
