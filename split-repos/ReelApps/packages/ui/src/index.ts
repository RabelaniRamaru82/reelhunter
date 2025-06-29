// UI package exports
import React from 'react';

export const Button: React.FC<any> = ({ children, ...props }) => {
  return React.createElement('button', props, children);
};

export const Card: React.FC<any> = ({ children, ...props }) => {
  return React.createElement('div', props, children);
};

export const AppWrapper: React.FC<any> = ({ children }) => {
  return React.createElement('div', {}, children);
};