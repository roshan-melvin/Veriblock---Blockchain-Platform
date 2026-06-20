
import { useParams } from 'react-router-dom';

export default function MissionDetail() {
  const { missionId } = useParams<{ missionId: string }>();

  return (
    <div className="p-6">
      <h1 className="text-4xl font-display font-bold text-primary mb-4">Investigating Case #{missionId}</h1>
      <p className="text-dim mb-6">
        Examine the case briefings, analyze provenance data, and determine whether the content has been tampered.
      </p>
      <div className="bg-panel p-6 rounded-lg border border-hairline max-w-sm w-full">
        <p className="text-sm text-unverified font-mono">Placeholder - Mission Detail for {missionId}</p>
      </div>
    </div>
  );
}
