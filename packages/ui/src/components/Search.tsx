import * as React from 'react';
import { CommandList } from 'cmdk';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './Command';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { CheckIcon, SearchIcon } from './Icons';

export type SearchItem = {
  label: string;
  value: string;
};

export interface SearchProps {
  items: SearchItem[];
  placeholder?: string;
  searchPlaceholder?: string;
}

const Search = ({ items, placeholder, searchPlaceholder }: SearchProps) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  // TODO: apply ds once it's complete
  // TODO: remove usage of button - it doesn't match DS requirements
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className="justify-between has-[p]:w-full"
          size={'lg'}
          icon={<SearchIcon />}
        >
          {value ? items.find((item) => item.value === value)?.label : placeholder ?? 'Search'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder ?? 'Search'} className="h-9" />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                >
                  {item.label}
                  <CheckIcon className={cn('ml-auto h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
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
