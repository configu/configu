import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const textVariants = cva('font-dmSans text-black dark:text-white', {
  variants: {
    variant: {
      h1: 'text-3xl font-black',
      h2: 'text-xl font-black',
      h3: 'text-base font-black',
      regular11: 'text-[11px] font-medium',
      regular13: 'text-[13px] font-medium',
      regular15: 'text-[15px] font-medium',
      bold11: 'text-[11px] font-bold',
      bold13: 'text-[13px] font-bold',
      bold15: 'text-[15px] font-bold',
    },
  },
});

export type TextProps = React.ButtonHTMLAttributes<HTMLParagraphElement> & VariantProps<typeof textVariants>;

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(({ className, variant, ...props }, ref) => (
  <p ref={ref} className={cn(textVariants({ variant, className }))} {...props} />
));
Text.displayName = 'Text';

export { Text, textVariants };
