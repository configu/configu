import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-gray-300 data-[state=unchecked]:bg-gray-300',
      'data-[state=checked]:border-blue data-[state=checked]:bg-blue',
      'dark:data-[state=unchecked]:bg-gray-700 dark:data-[state=unchecked]:border-gray-700',
      'disabled:cursor-not-allowed disabled:data-[state=unchecked]:bg-gray-200 disabled:border-gray-200',
      'disabled:data-[state=checked]:bg-blue-300 disabled:data-[state=checked]:border-blue-300',
      'dark:disabled:data-[state=checked]:bg-blue-700 dark:disabled:data-[state=checked]:border-blue-700',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-[18px] w-[18px] rounded-full bg-white transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
        'data-[disabled]:bg-gray-100 dark:data-[disabled]:bg-gray-300',
        'data-[disabled]:data-[state=checked]:bg-blue-100 dark:data-[disabled]:data-[state=checked]:bg-blue-300',
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
