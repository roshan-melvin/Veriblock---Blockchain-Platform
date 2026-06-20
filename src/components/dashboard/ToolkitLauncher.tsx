import { useNavigate } from 'react-router-dom';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'locked' | 'coming-soon';
  accentColor: string;
}

const TOOLS: Tool[] = [
  {
    id: 'hash-lab',
    title: 'Hash Computation Lab',
    description: 'Compute SHA-256 hashes in real-time. Observe the avalanche effect — tiny changes shatter the output.',
    icon: '#',
    route: '/tools/hash-lab',
    status: 'active',
    accentColor: 'verified',
  },
  {
    id: 'chain-explorer',
    title: 'Blockchain Explorer',
    description: 'Build, validate, and tamper with chains. Witness cascading invalidation when integrity breaks.',
    icon: '⛓',
    route: '/tools/chain-explorer',
    status: 'active',
    accentColor: 'gold',
  },
  {
    id: 'signature-panel',
    title: 'Signature Verification',
    description: 'Validate ECDSA signatures against trusted public keys. Coming in Phase 5.',
    icon: '🔏',
    route: '/tools/signature-panel',
    status: 'coming-soon',
    accentColor: 'unverified',
  },
];

export function ToolkitLauncher() {
  const navigate = useNavigate();

  return (
    <div role="region" aria-label="Investigation toolkit">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">Investigation Toolkit</span>
        <div className="flex-1 h-px bg-hairline" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool, index) => (
          <button
            key={tool.id}
            id={`toolkit-${tool.id}`}
            onClick={() => tool.status === 'active' && navigate(tool.route)}
            disabled={tool.status !== 'active'}
            className={`group relative bg-panel border rounded-lg p-5 text-left transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-gold animate-fade-in-up
              ${tool.status === 'active'
                ? 'border-hairline hover:border-gold/50 hover:bg-panel-raised cursor-pointer'
                : 'border-hairline/50 opacity-50 cursor-not-allowed'
              }
            `}
            style={{ animationDelay: `${0.15 + index * 0.1}s` }}
            aria-label={`${tool.title}${tool.status !== 'active' ? ' - Coming Soon' : ''}`}
          >
            {/* Hover glow */}
            <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-${tool.accentColor}/5 to-transparent`} />

            <div className="relative z-10">
              {/* Icon + status */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl" aria-hidden="true">{tool.icon}</span>
                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  tool.status === 'active'
                    ? 'text-verified bg-verified/10 border-verified/20'
                    : 'text-dim bg-panel-raised border-hairline'
                }`}>
                  {tool.status === 'active' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <h3 className="text-sm font-display font-semibold text-primary mb-1 group-hover:text-gold transition-colors duration-200">
                {tool.title}
              </h3>
              <p className="text-[11px] text-dim leading-relaxed">{tool.description}</p>

              {/* Launch indicator */}
              {tool.status === 'active' && (
                <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-dim group-hover:text-gold transition-colors duration-200">
                  <span>LAUNCH</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
