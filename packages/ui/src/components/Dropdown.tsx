import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../lib/utils';
import { CheckIcon, ChevronDownIcon } from './Icons';
import { Text } from './Typography';

const Dropdown = SelectPrimitive.Root;

const DropdownGroup = SelectPrimitive.Group;

const DropdownValue = SelectPrimitive.Value;

export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  label?: string;
  icon?: React.ReactElement<SVGElement>;
  errorMessage?: string;
}

const DropdownTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
  ({ className, children, label, icon, errorMessage, ...props }, ref) => (
    <div>
      {label && (
        <div className="pb-1.5 text-gray-800 dark:text-gray-300">
          <Text variant={'bold13'}>{label}</Text>
        </div>
      )}
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-3xl border border-gray-200 px-4 py-2 text-gray-400 hover:border-gray-400 focus:outline-none [&>span]:line-clamp-1',
          'data-[state=open]:border-blue-400 data-[state=open]:text-blue-400',
          'dark:border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-white',
          'dark:data-[state=open]:border-blue-300 dark:data-[state=open]:text-blue-300',
          'disabled:cursor-not-allowed disabled:border-gray-200 disabled:opacity-50 disabled:dark:border-gray-300',
          className,
        )}
        {...props}
      >
        <div className="inline-flex items-center overflow-hidden">
          {icon && <div className="mr-2">{icon}</div>}
          <Text variant="regular13" className="truncate">
            {children}
          </Text>
        </div>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      {errorMessage && (
        <div className="text-red pt-1.5">
          <Text variant={'regular13'}>{errorMessage}</Text>
        </div>
      )}
    </div>
  ),
);
DropdownTrigger.displayName = SelectPrimitive.Trigger.displayName;

const DropdownContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 overflow-hidden rounded-3xl border border-blue-400 bg-white shadow-[0_2px_14px_0_#0000001F] dark:border-blue-200 dark:bg-gray-900 dark:shadow-[0_2px_14px_0_#FFFFFF6B]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-[-1px] data-[side=left]:-translate-x-[-1px] data-[side=right]:translate-x-[-1px] data-[side=top]:-translate-y-[-1px]',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full max-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
DropdownContent.displayName = SelectPrimitive.Content.displayName;

const DropdownItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'cursor-default select-none text-wrap pb-[11px] pl-4 pt-3 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'text-gray-600 hover:border-0 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200',
      'active:text-blue active:bg-blue-100 dark:active:bg-blue-900 dark:active:text-blue-300',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-1">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>
        <Text variant={'regular13'}>{children}</Text>
      </SelectPrimitive.ItemText>
    </div>
  </SelectPrimitive.Item>
));
DropdownItem.displayName = SelectPrimitive.Item.displayName;

export { Dropdown, DropdownGroup, DropdownValue, DropdownTrigger, DropdownContent, DropdownItem };
