import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const [beeCount, setBeeCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch live stats
    fetch('http://localhost:8000/api/v1/bees')
      .then(res => res.json())
      .then(data => setBeeCount(data.count || 0))
      .catch(console.error);

    fetch('http://localhost:8000/api/v1/telemetry')
      .then(res => res.json())
      .then(data => setTaskCount(data.count || 0))
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="animated-background"></div>

      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            <span className="gradient-text">Colony OS</span>
            <br />
            Living Digital Organism
          </h1>

          <p className="hero-subtitle">
            Self-organizing AI orchestration with semantic routing,
            durable workflows, and Byzantine consensus.
            <br />
            <strong>Production-ready. Open source. Unstoppable.</strong>
          </p>

          <div className="stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-value gradient-text">{beeCount}</div>
              <div className="stat-label">Active Bees</div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-value gradient-text">{taskCount}</div>
              <div className="stat-label">Tasks Executed</div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-value gradient-text">4</div>
              <div className="stat-label">Core Layers</div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-value gradient-text">1.4K+</div>
              <div className="stat-label">Lines of Code</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/hivemind')}
              style={{ cursor: 'pointer' }}
            >
              🐝 Enter Hive Mind
            </button>

            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                📖 API Docs
              </button>
            </a>

            <a href="https://github.com/brandonlacoste9-tech/adgenxai-blueprint-launch" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                ⭐ GitHub
              </button>
            </a>
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-16) var(--space-6)', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span className="gradient-text">The Complete Stack</span>
          </h2>

          <div className="bee-grid">
            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">🧠</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Semantic Router</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                AI-powered task-to-bee matching using vector embeddings and similarity scoring for intelligent routing.
              </p>
            </div>

            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">⚡</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Real-time Streaming</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                WebSocket telemetry broadcasting with per-bee and hive-wide channels for live updates.
              </p>
            </div>

            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">🔄</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Temporal Workflows</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Durable orchestration with automatic retries, exponential backoff, and fault tolerance.
              </p>
            </div>

            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">🛡️</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Guardian Consensus</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Byzantine fault-tolerant voting with immutable audit trails and integrity verification.
              </p>
            </div>

            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">🐝</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Bee Registry</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Dynamic bee registration, heartbeat management, and capability tracking in the colony.
              </p>
            </div>

            <div className="glass-card bee-card glow-border">
              <div className="bee-icon">📊</div>
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: '1.25rem', fontWeight: 600 }}>Live Telemetry</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Real-time event streaming from all bees with full task lifecycle visibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-16) var(--space-6)', background: 'var(--bg-primary)' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span className="gradient-text">Integrate Your AI</span>
          </h2>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="glass-card">
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.25rem', fontWeight: 600 }}>KOLONI Studio Integration</h3>

              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                KOLONI Creator Studio is already integrated as a bee with LongCat (text) and EMU (image) capabilities.
              </p>

              <div className="code-block">
{`import { createKoloniClient } from 'koloni-client-sdk';

const colonyOS = createKoloniClient(
  'http://localhost:8000'
);

// Register KOLONI as bee
await colonyOS.registerBee({
  bee_id: 'koloni-001',
  model_capabilities: ['LongCat', 'EMU']
});

// Submit task
const result = await colonyOS.submitTask({
  task_type: 'generate_text',
  description: 'Write blog post'
});`}
              </div>

              <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)', fontSize: '0.9rem' }}>
                ✅ Bee registration ✅ Heartbeat tracking ✅ Task submission ✅ Real-time telemetry ✅ Status monitoring
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
