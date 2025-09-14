import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface UserIconProps {
  name?: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function UserIcon({ name, image, size = 'md', className = '', onClick }: UserIconProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (user) {
      navigate('/profile');
    }
  };

  if (image) {
    return (
      <div 
        onClick={handleClick}
        className={`relative rounded-full overflow-hidden cursor-pointer ${sizeClasses[size]} ${className} transition-all duration-200 hover:opacity-90`}
      >
        <img
          src={image}
          alt={name || 'User'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (name) {
    return (
      <div
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          ${className}
          flex items-center justify-center
          rounded-full
          bg-indigo-100
          text-indigo-600
          font-medium
          cursor-pointer
          transition-all duration-200
          hover:bg-indigo-200
        `}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        ${className}
        flex items-center justify-center
        rounded-full
        bg-gray-100
        text-gray-600
        cursor-pointer
        transition-all duration-200
        hover:bg-gray-200
      `}
    >
      <User className="w-1/2 h-1/2" />
    </div>
  );
}