import React from 'react';
import Button, {type ButtonProps} from './Button';

export interface ButtonPrimaryProps extends ButtonProps {}

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  className = '',
  sizeClass = 'py-3 px-4 lg:py-3.5 lg:px-8',
  ...args
}) => {
  return (
    <Button
      className={`bg-secondary-800 text-white shadow-xl hover:bg-secondary-900 disabled:bg-opacity-90 ${className}`}
      sizeClass={sizeClass}
      {...args}
    />
  );
};

export default ButtonPrimary;
