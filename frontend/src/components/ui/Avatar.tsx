interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorClasses = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-600',
  'bg-indigo-100 text-indigo-600',
];

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getColorClass = (name: string) => {
    const index = name.charCodeAt(0) % colorClasses.length;
    return colorClasses[index];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${getColorClass(name)} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
