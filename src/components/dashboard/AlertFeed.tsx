import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'OK' | 'WARN' | 'FAIL' | 'INFO';
  message: string;
}

const TEMPLATE_LOGS = [
  { type: 'INFO', message: 'Analyzing inbound media provenance streams...' },
  { type: 'OK', message: 'Block #1452 verified. Integrity score: 100%' },
  { type: 'FAIL', message: 'Signature mismatch detected on viral post attachment' },
  { type: 'WARN', message: 'Avalanche effect triggered: input shift altered 98% of output bits' },
  { type: 'OK', message: 'ECDSA public key verified against trusted publisher directory' },
  { type: 'INFO', message: 'Syncing ledger data with local storage engine...' },
  { type: 'FAIL', message: 'Ledger integrity compromise: Block #2 contents altered' },
  { type: 'WARN', message: 'Suspicious edit pattern on civic archive records' },
  { type: 'OK', message: 'All 3 publisher nodes report consistent hash matches' },
  { type: 'INFO', message: 'Initializing digital investigator forensics workstation...' }
] as const;

export function AlertFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate initial logs on mount
  useEffect(() => {
    const initialLogs: LogEntry[] = [];
    const now = new Date();
    for (let i = 0; i < 5; i++) {
      const template = TEMPLATE_LOGS[Math.floor(Math.random() * TEMPLATE_LOGS.length)];
      const logTime = new Date(now.getTime() - (5 - i) * 5000);
      initialLogs.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: template.type,
        message: template.message
      });
    }
    setLogs(initialLogs);
  }, []);

  // Set up live interval logs
  useEffect(() => {
    const interval = setInterval(() => {
      const template = TEMPLATE_LOGS[Math.floor(Math.random() * TEMPLATE_LOGS.length)];
      const now = new Date();
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type: template.type,
        message: template.message
      };

      setLogs((prev) => {
        const next = [...prev, newLog];
        // Cap at last 50 logs to prevent memory leak
        return next.slice(-50);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyle = (type: LogEntry['type']) => {
    switch (type) {
      case 'OK':
        return 'text-verified';
      case 'WARN':
        return 'text-unverified';
      case 'FAIL':
        return 'text-tampered';
      case 'INFO':
      default:
        return 'text-dim';
    }
  };

  return (
    <div className="bg-panel border border-hairline rounded-lg p-4 flex flex-col h-48 w-full shadow-lg relative overflow-hidden">
      {/* Terminal Title Header */}
      <div className="flex items-center justify-between border-b border-hairline pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-tampered animate-pulse"></span>
          <span className="text-[10px] font-mono font-semibold text-gold tracking-wider uppercase">
            Live Diagnostics Alert Feed
          </span>
        </div>
        <div className="text-[9px] font-mono text-dim uppercase">SYS STATUS: MONITORED</div>
      </div>

      {/* Terminal Box */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-hairline scrollbar-track-transparent pr-2"
        role="log"
        aria-label="Diagnostic logs feed"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 hover:bg-void/40 px-1 py-0.5 rounded transition-colors">
            <span className="text-dim text-[10px] select-none">{log.timestamp}</span>
            <span className={`font-bold select-none ${getTypeStyle(log.type)}`}>
              [{log.type.padEnd(4)}]
            </span>
            <span className="text-primary tracking-wide text-[11px]">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
