

interface AvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

export function Avatar({ seed, size = 48, className = '' }: AvatarProps) {
  // Normalize seed to one of our 6 styles
  const normalizedSeed = seed.toLowerCase().trim();

  // Draw SVGs procedurally depending on the seed
  let svgContent = null;

  switch (normalizedSeed) {
    case 'matrix':
      svgContent = (
        <>
          <rect width="100" height="100" fill="#0B130E" />
          <path d="M20 10v80M40 20v60M60 10v80M80 30v45" stroke="#2BD97C" strokeWidth="6" strokeDasharray="4 6" opacity="0.6" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#2BD97C" strokeWidth="8" />
          <rect x="45" y="45" width="10" height="10" fill="#2BD97C" />
        </>
      );
      break;

    case 'nexus':
      svgContent = (
        <>
          <rect width="100" height="100" fill="#132332" />
          <line x1="20" y1="20" x2="80" y2="80" stroke="#00d2ff" strokeWidth="4" />
          <line x1="80" y1="20" x2="20" y2="80" stroke="#00d2ff" strokeWidth="4" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#00d2ff" strokeWidth="2" opacity="0.5" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#00d2ff" strokeWidth="2" opacity="0.5" />
          <circle cx="50" cy="50" r="14" fill="#132332" stroke="#00d2ff" strokeWidth="6" />
          <circle cx="20" cy="20" r="8" fill="#00d2ff" />
          <circle cx="80" cy="80" r="8" fill="#00d2ff" />
          <circle cx="80" cy="20" r="8" fill="#00d2ff" />
          <circle cx="20" cy="80" r="8" fill="#00d2ff" />
          <circle cx="50" cy="50" r="6" fill="#E8EDF2" />
        </>
      );
      break;

    case 'orbit':
      svgContent = (
        <>
          <rect width="100" height="100" fill="#1A1528" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="#FF9F43" strokeWidth="3" strokeDasharray="10 5" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="#FF9F43" strokeWidth="5" />
          <circle cx="50" cy="50" r="10" fill="#FF9F43" />
          <circle cx="20" cy="35" r="5" fill="#E8EDF2" />
          <circle cx="75" cy="70" r="7" fill="#FF9F43" />
        </>
      );
      break;

    case 'prism':
      svgContent = (
        <>
          <rect width="100" height="100" fill="#24122C" />
          <polygon points="50,15 85,75 15,75" fill="none" stroke="#D4AF37" strokeWidth="6" />
          <line x1="50" y1="15" x2="50" y2="75" stroke="#D4AF37" strokeWidth="3" opacity="0.7" />
          <polygon points="50,35 70,70 30,70" fill="#D4AF37" opacity="0.3" />
          <circle cx="50" cy="52" r="8" fill="#E8EDF2" />
        </>
      );
      break;

    case 'quantum':
      svgContent = (
        <>
          <rect width="100" height="100" fill="#2D1318" />
          <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#FF4D4F" strokeWidth="4" transform="rotate(30 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#FF4D4F" strokeWidth="4" transform="rotate(-30 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#FF4D4F" strokeWidth="4" transform="rotate(90 50 50)" />
          <circle cx="50" cy="50" r="10" fill="#FF4D4F" />
          <circle cx="50" cy="50" r="4" fill="#E8EDF2" />
        </>
      );
      break;

    case 'cipher':
    default:
      svgContent = (
        <>
          <rect width="100" height="100" fill="#151B22" />
          <rect x="20" y="20" width="60" height="60" rx="6" fill="none" stroke="#8A97A3" strokeWidth="4" />
          <circle cx="50" cy="50" r="16" fill="none" stroke="#D4AF37" strokeWidth="5" />
          <line x1="50" y1="10" x2="50" y2="90" stroke="#8A97A3" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="#8A97A3" strokeWidth="2" strokeDasharray="6 6" />
          <polygon points="50,42 58,55 42,55" fill="#D4AF37" />
        </>
      );
      break;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded border border-hairline ${className}`}
      aria-label={`Avatar style: ${seed}`}
      role="img"
    >
      {svgContent}
    </svg>
  );
}
