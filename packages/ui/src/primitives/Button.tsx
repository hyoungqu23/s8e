import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const styles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition',
  secondary: 'px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-50 transition'
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...rest }) => {
  return <button className={`${styles[variant]} ${className}`} {...rest} />;
};
