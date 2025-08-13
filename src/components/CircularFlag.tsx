"use client";
import React from 'react';
import ReactCountryFlag from 'react-country-flag';

interface CircularFlagProps {
  countryCode: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function CircularFlag({ countryCode, size = 'medium', className = '' }: CircularFlagProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8', 
    large: 'w-10 h-10'
  };

  const flagSizes = {
    small: '1.2em',
    medium: '1.5em',
    large: '2em'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center ${className}`}>
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{
          width: flagSizes[size],
          height: flagSizes[size],
          borderRadius: '50%',
          objectFit: 'cover'
        }}
        title={countryCode}
      />
    </div>
  );
}
