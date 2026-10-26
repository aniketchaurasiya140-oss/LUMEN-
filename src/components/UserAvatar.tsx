import React from 'react';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const getInitials = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return 'LU';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-20 h-20 text-xl font-bold'
  };

  const initials = getInitials(name);

  if (avatar && avatar.trim().length > 0) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-[#c45a2c]/30 shadow-xs ${className}`}
      />
    );
  }

  // Clean, neutral monogram/initials avatar
  return (
    <div
      aria-label={`${name} avatar initials: ${initials}`}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#38312b] to-[#201c19] text-[#f5ede3] border border-[#524942] flex items-center justify-center font-serif tracking-wider shadow-xs select-none ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
};
