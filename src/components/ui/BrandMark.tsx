import React from 'react';
import { SAINT_PAUL_ICON } from '../../lib/constants';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-24 h-24',
};

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 'md', className = '' }) => (
  <div className={`${sizeClass[size]} rounded-xl overflow-hidden border border-amber-600/50 bg-stone-100 dark:bg-stone-800 shrink-0 ${className}`}>
    <img
      src={SAINT_PAUL_ICON}
      alt="أيقونة القديس بولس الرسول"
      className="w-full h-full object-cover"
      width={96}
      height={96}
      decoding="async"
    />
  </div>
);
