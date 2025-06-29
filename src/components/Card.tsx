import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
}

interface CardStatProps {
  value: string | number;
  label: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Footer: React.FC<CardFooterProps>;
  Stat: React.FC<CardStatProps>;
} = ({
  children,
  variant = 'default',
  interactive = false,
  onClick,
  className = '',
}) => {
  const baseClasses = [
    styles.baseCard,
    styles[variant],
    interactive && styles.interactive,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, description }) => (
  <div className={styles.cardHeader}>
    {icon && <div className={styles.cardIcon}>{icon}</div>}
    <div>
      <h3 className={styles.cardTitle}>{title}</h3>
      {description && <p className={styles.cardDescription}>{description}</p>}
    </div>
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children }) => (
  <div className={styles.cardFooter}>{children}</div>
);

const CardStat: React.FC<CardStatProps> = ({ value, label }) => (
  <div className={styles.cardStat}>
    <span className={styles.cardStatValue}>{value}</span>
    <span className={styles.cardStatLabel}>{label}</span>
  </div>
);

Card.Header = CardHeader;
Card.Footer = CardFooter;
Card.Stat = CardStat;

export default Card; 