import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactElement<SVGElement>;
}

// TODO: add disabled state once we have a design for it
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, ...props }, ref) => {
  return (
    <div
      className={cn(
        'relative w-full group text-gray-400 focus-within:text-gray-800 dark:focus-within:text-white',
        props.disabled ? 'opacity-50' : '',
      )}
    >
      {icon && <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">{icon}</div>}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-3xl px-4 py-2 text-sm focus-visible:outline-none border focus:placeholder-gray-800 dark:focus:placeholder-white border-gray-200 dark:border-gray-300 dark:bg-gray-900 hover:border-gray-400 dark:group-hover:border-white focus:border-gray-800 dark:focus:border-white disabled:cursor-not-allowed disabled:group-hover:border-gray-200 dark:disabled:group-hover:border-gray-300',
          icon ? 'pl-10' : '',
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
