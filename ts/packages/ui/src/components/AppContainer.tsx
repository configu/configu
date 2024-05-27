import React from 'react';
import { cn } from '../lib/utils';

const AppContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-blue flex h-screen w-screen flex-col overflow-hidden dark:bg-blue-700', className)}
      {...props}
    >
      {props.children}
    </div>
  ),
);
AppContainer.displayName = 'AppContainer';

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-4xl mx-[13px] mt-3 flex-1 bg-white dark:bg-black', className)} {...props}>
      {props.children}
    </div>
  ),
);
Header.displayName = 'Header';

const Footer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('h-[74px]', className)} {...props}>
      {props.children}
    </div>
  ),
);
Footer.displayName = 'Footer';

export { AppContainer, Header, Footer };
