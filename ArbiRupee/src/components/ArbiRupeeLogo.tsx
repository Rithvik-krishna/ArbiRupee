import React from 'react';
import Image from 'next/image';

interface ArbiRupeeLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  width?: number;
  height?: number;
}

export const ArbiRupeeLogo: React.FC<ArbiRupeeLogoProps> = ({ 
  variant = 'full', 
  className = '',
  width,
  height 
}) => {
  const logoSrc = variant === 'full' ? '/arbirupee-logo.png' : '/arbirupee-icon.png';
  
  const defaultDimensions = variant === 'full' 
    ? { width: 200, height: 60 }
    : { width: 40, height: 40 };

  return (
    <Image
      src={logoSrc}
      alt="ArbiRupee Logo"
      width={width || defaultDimensions.width}
      height={height || defaultDimensions.height}
      className={className}
      priority
    />
  );
};

export default ArbiRupeeLogo;
