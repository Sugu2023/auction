interface TeamLogoProps {
  src: string;
  name: string;
  size?: number;
}

export function TeamLogo({ src, name, size = 48 }: TeamLogoProps) {
  return (
    <img
      className="team-logo"
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={e => {
        e.currentTarget.style.visibility = 'hidden';
      }}
    />
  );
}
