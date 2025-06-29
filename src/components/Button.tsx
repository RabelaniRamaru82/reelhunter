import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  href,
  className = '',
  type = 'button',
  id,
}) => {
  const baseClasses = [
    styles.baseButton,
    styles[variant],
    size !== 'medium' && styles[size],
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <a 
        href={href} 
        className={baseClasses}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={disabled}
      onClick={onClick}
      id={id}
    >
      {children}
    </button>
  );
};

export default Button; 