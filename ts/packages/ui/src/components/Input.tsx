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
        'group relative w-full text-gray-400 focus-within:text-gray-800 dark:focus-within:text-white',
        props.disabled ? 'opacity-50' : '',
      )}
    >
      {icon && <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transform">{icon}</div>}
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-3xl border border-gray-200 px-4 py-2 text-[13px] font-medium hover:border-gray-400 focus:border-gray-800 focus:placeholder-gray-800 focus-visible:outline-none disabled:cursor-not-allowed disabled:group-hover:border-gray-200 dark:border-gray-300 dark:bg-gray-900 dark:focus:border-white dark:focus:placeholder-white dark:group-hover:border-white dark:disabled:group-hover:border-gray-300',
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
