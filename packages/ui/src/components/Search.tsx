import * as React from 'react';
import { CommandList } from 'cmdk';
import { cn } from '../lib/utils';
import { Command, CommandEmpty, CommandInput, CommandItem } from './Command';
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'flex h-10 cursor-pointer items-center justify-between rounded-3xl border border-gray-200 pb-3 pl-4 pr-3 pt-[11px] text-gray-400 hover:border-gray-400 dark:border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-white',
            internalValue &&
              'border-black text-black hover:border-black dark:border-white dark:text-white dark:hover:border-white',
            open &&
              'border-blue-400 text-blue-400 hover:border-blue-400 dark:border-blue-300 dark:text-blue-300 dark:hover:border-blue-300',
          )}
        >
          <div className="flex items-center space-x-2 truncate">
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
      <PopoverContent>
        <Command value={internalValue} filter={(val, search) => (val.includes(search) ? 1 : -1)}>
          <CommandInput placeholder={searchPlaceholder ?? 'Search'} />
          <CommandList>
            <CommandEmpty>
              <Text variant={'regular13'}>No item found.</Text>
            </CommandEmpty>
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={(currentValue) => {
                  updateValue(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-1">
                  <div className={cn(internalValue !== item.value && 'hidden')}>
                    <CheckIcon />
                  </div>
                  <div>
                    <Text variant={'regular13'}> {item.label}</Text>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
Search.displayName = 'Search';

export { Search };
