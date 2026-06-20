
import { useParams } from 'react-router-dom';

export default function MissionReplay() {
  const { missionId } = useParams<{ missionId: string }>();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-display font-bold text-primary mb-4">Decision Replay #{missionId}</h1>
      <p className="text-dim mb-6">
        Walk through the timestamped log of decision steps you took during this investigation.
      </p>
      <div className="bg-panel p-6 rounded-lg border border-hairline max-w-sm w-full">
        <p className="text-sm text-unverified font-mono">Placeholder - Mission Replay for {missionId}</p>
      </div>
    </div>
  );
}
