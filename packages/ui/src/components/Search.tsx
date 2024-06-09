import * as React from 'react';
import { CommandList } from 'cmdk';
import { cn } from '../lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './Command';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { CheckIcon, CloseIcon, SearchIcon } from './Icons';
import { Text } from './Typography';

export type SearchItem = {
  label: string;
  value: string;
};

export interface SearchProps {
  items: SearchItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Search = ({ items, placeholder, searchPlaceholder, value, onValueChange }: SearchProps) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState('');

  React.useEffect(() => {
    setInternalValue(value ?? '');
  }, [value]);

  const updateValue = (nextValue: string) => {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  // TODO: apply ds once it's complete
  // TODO: try using button instead of div for accessibility
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex h-10 cursor-pointer items-center justify-between rounded-3xl border pb-3 pl-4 pr-3 pt-[11px] hover:border-gray-400 dark:border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-white',
            internalValue
              ? 'border-black text-black hover:border-black dark:border-white dark:text-white dark:hover:border-white'
              : 'border-gray-200 text-gray-400 dark:border-gray-300',
          )}
        >
          <div className="flex items-center space-x-2">
            <div>
              <SearchIcon />
            </div>
            <div>
              <Text variant="regular13">
                {internalValue ? items.find((item) => item.value === internalValue)?.label : placeholder ?? 'Search'}
              </Text>
            </div>
          </div>
          {internalValue && (
            <div
              onClick={(event) => {
                // * Prevents the popover from opening
                event.preventDefault();
                updateValue('');
              }}
            >
              <CloseIcon />
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command value={internalValue}>
          <CommandInput placeholder={searchPlaceholder ?? 'Search'} className="h-9" />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    updateValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <CheckIcon
                    className={cn('ml-auto h-4 w-4', internalValue === item.value ? 'opacity-100' : 'opacity-0')}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
Search.displayName = 'Search';

export { Search };
