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
      'dark:data-[state=unchecked]:border-gray-700 dark:data-[state=unchecked]:bg-gray-700',
      'disabled:cursor-not-allowed disabled:border-gray-200 disabled:data-[state=unchecked]:bg-gray-200',
      'disabled:data-[state=checked]:border-blue-300 disabled:data-[state=checked]:bg-blue-300',
      'dark:disabled:data-[state=checked]:border-blue-700 dark:disabled:data-[state=checked]:bg-blue-700',
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
  const [internalChecked, setInternalChecked] = React.useState(props.defaultChecked ?? false);
  const isChecked = React.useMemo(() => {
    if (props.checked !== undefined) return props.checked;
    return internalChecked;
  }, [props.checked, internalChecked]);

  return (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-10 w-16 cursor-pointer items-center rounded-full border border-gray-200 data-[state=checked]:border-gray-600 data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-white',
        className,
      )}
      {...props}
      ref={ref}
      onCheckedChange={(next: boolean) => {
        setInternalChecked(next);
        props.onCheckedChange?.(next);
      }}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-yellow pointer-events-none flex h-[38px] w-[38px] items-center justify-center rounded-full border border-yellow-600 transition-transform',
          'data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:translate-x-6 data-[state=checked]:border-blue-200 data-[state=checked]:bg-blue-800',
          'data-[state=checked]:text-[#FFF5B8] data-[state=unchecked]:text-[#7A5C09]',
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
