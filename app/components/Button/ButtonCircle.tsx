import React, {type ButtonHTMLAttributes} from 'react';
import twFocusClass from '@/utils/twFocusClass';

export interface ButtonCircleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: string;
}

const ButtonCircle: React.FC<ButtonCircleProps> = ({
  className = ' ',
  size = ' w-9 h-9 ',
  ...args
}) => {
  return (
    <button
      className={
        `flex items-center justify-center rounded-full bg-secondary-800 !leading-none text-white hover:bg-secondary-900 
        disabled:bg-opacity-70 ${className} ${size} ` + twFocusClass(true)
      }
      {...args}
    />
  );
};

export default ButtonCircle;
