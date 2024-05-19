import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const messageVariants = cva(
  'relative w-full rounded-xl border p-2.5 [&>svg~*]:pl-[26px] [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-2.5 [&>svg]:top-2.5',
  {
    variants: {
      variant: {
        success:
          'bg-green-200 text-green-800 border-green-400 dark:bg-green-900 dark:text-green-100 dark:border-green-600',
        warning: 'bg-red-200 text-red-600 border-red-400 dark:bg-red-900 dark:text-red-100 dark:border-red-600',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  },
);

const Message = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(messageVariants({ variant }), className)} {...props} />
));
Message.displayName = 'Message';

const MessageTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
  ),
);
MessageTitle.displayName = 'MessageTitle';

const MessageDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
  ),
);
MessageDescription.displayName = 'MessageDescription';

export { Message, MessageTitle, MessageDescription };
