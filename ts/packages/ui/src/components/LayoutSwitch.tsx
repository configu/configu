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
        'inline-flex items-center justify-center whitespace-nowrap px-7 h-full text-sm font-medium text-gray dark:text-gray-400 dark:data-[state=active]:text-blue-300 bg-gray-100 dark:bg-gray-900 first:rounded-l-3xl last:rounded-r-3xl disabled:pointer-events-none border border-gray-200 dark:border-gray-400 dark:data-[state=active]:border-blue-300 hover:text-gray-800 hover:border-gray-800 dark:hover:text-gray-200 dark:hover:border-gray-300  data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900 data-[state=active]:text-blue data-[state=active]:border-blue',
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
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
LayoutSwitchContent.displayName = 'LayoutSwitchContent';

export { LayoutSwitch, LayoutSwitchList, LayoutSwitchTrigger, LayoutSwitchContent };
