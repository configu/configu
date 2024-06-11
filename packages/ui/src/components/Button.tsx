import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Text } from './Typography';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-3xl ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none has-[p]:w-min',
  {
    variants: {
      variant: {
        default:
          'bg-blue text-white hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-200 dark:disabled:bg-blue-900 dark:disabled:text-gray-300',
        secondary:
          'bg-white text-gray-900 dark:text-white border border-gray-300 hover:bg-gray-100 hover:border-gray-700 active:bg-gray-200 active:border-gray-900 disabled:border-gray-300 disabled:text-gray-300 dark:bg-gray-900 dark:border-gray dark:hover:bg-gray-800 dark:active:border-gray-100 dark:active:bg-gray-900 dark:disabled:text-gray',
        ghost:
          'text-blue hover:text-blue-700 active:bg-blue-100 disabled:text-blue-200 dark:text-blue-300 dark:hover:text-blue-400 dark:active:bg-blue-900 dark:disabled:text-blue-300 dark:disabled:text-blue-600',
        danger:
          'bg-red text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-200 dark:text-white dark:disabled:bg-red-900 dark:disabled:text-gray-300',
      },
      size: {
        sm: 'h-6 w-6 has-[p]:px-5',
        default: 'h-8 w-8 has-[p]:px-6',
        lg: 'h-10 w-10 has-[p]:px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: React.ReactElement<SVGElement>;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <div className={props.disabled ? 'w-min cursor-not-allowed' : ''}>
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          <div className="inline-flex items-center">
            {icon && <div className={props.children ? 'mr-1' : undefined}>{icon}</div>}
            {props.children && <Text variant="bold13">{props.children}</Text>}
          </div>
        </Comp>
      </div>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };