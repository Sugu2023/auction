import { useState } from 'react';

interface PlayerPhotoProps {
  src?: string;
  name: string;
}

export function PlayerPhoto({ src, name }: PlayerPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return <div className="player-photo player-photo-fallback">{initials}</div>;
  }

  return <img className="player-photo" src={src} alt={name} onError={() => setFailed(true)} />;
}
