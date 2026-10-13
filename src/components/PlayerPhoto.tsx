import { useState } from 'react';

interface PlayerPhotoProps {
  src?: string;
  name: string;
  thumbnail?: boolean;
}

export function PlayerPhoto({ src, name, thumbnail = false }: PlayerPhotoProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = thumbnail ? 'player-photo player-photo-thumb' : 'player-photo';

  if (!src || failed) {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return <div className={`${sizeClass} player-photo-fallback`}>{initials}</div>;
  }

  return <img className={sizeClass} src={src} alt={name} onError={() => setFailed(true)} />;
}
