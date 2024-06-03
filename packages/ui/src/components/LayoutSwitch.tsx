import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/utils';
import { Text } from './Typography';

const LayoutSwitch = TabsPrimitive.Root;
LayoutSwitch.displayName = 'LayoutSwitch';

const LayoutSwitchList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('inline-flex h-10 items-center justify-center', className)} {...props} />
));
LayoutSwitchList.displayName = 'LayoutSwitchList';

export interface LayoutSwitchTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactElement<SVGElement>;
}

const LayoutSwitchTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, LayoutSwitchTriggerProps>(
  ({ className, children, icon, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'text-gray data-[state=active]:text-blue data-[state=active]:border-blue inline-flex h-full w-28 items-center justify-center whitespace-nowrap border border-gray-200 bg-gray-100 text-sm font-medium first:rounded-l-3xl last:rounded-r-3xl hover:border-gray-800 hover:text-gray-800 disabled:pointer-events-none data-[state=active]:bg-blue-100 dark:border-gray-400 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-300 dark:hover:text-gray-200 dark:data-[state=active]:border-blue-300 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300',
        className,
      )}
      {...props}
    >
      {icon && <div className="mr-1.5">{icon}</div>}
      <Text variant="bold15">{children}</Text>
    </TabsPrimitive.Trigger>
  ),
);
LayoutSwitchTrigger.displayName = 'LayoutSwitchTrigger';

const LayoutSwitchContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
LayoutSwitchContent.displayName = 'LayoutSwitchContent';

export { LayoutSwitch, LayoutSwitchList, LayoutSwitchTrigger, LayoutSwitchContent };
