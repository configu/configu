import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../lib/utils';
import { DarkModeIcon, LightModeIcon } from './Icons';

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

const DARK_MODE_SWITCH_THUMB_ICON_SIZE = 28;

const DarkModeSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(props.defaultChecked ?? false);

  const handleCheckedChange = (checked: boolean) => {
    setIsChecked(checked);
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-10 w-16 cursor-pointer items-center rounded-full border border-gray-200 data-[state=unchecked]:bg-white data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-600',
        className,
      )}
      {...props}
      ref={ref}
      onCheckedChange={(checked: boolean) => {
        handleCheckedChange(checked);
        props.onCheckedChange?.(checked);
      }}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-[38px] w-[38px] rounded-full bg-yellow border border-yellow-600 transition-transform flex items-center justify-center',
          'data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:translate-x-6 data-[state=checked]:bg-blue-800 data-[state=checked]:border-blue-200',
          'data-[state=unchecked]:text-[#7A5C09] data-[state=checked]:text-[#FFF5B8]',
        )}
      >
        {isChecked ? (
          <DarkModeIcon width={DARK_MODE_SWITCH_THUMB_ICON_SIZE} height={DARK_MODE_SWITCH_THUMB_ICON_SIZE} />
        ) : (
          <LightModeIcon width={DARK_MODE_SWITCH_THUMB_ICON_SIZE} height={DARK_MODE_SWITCH_THUMB_ICON_SIZE} />
        )}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  );
});
DarkModeSwitch.displayName = 'DarkModeSwitch';

export { Switch, DarkModeSwitch };
