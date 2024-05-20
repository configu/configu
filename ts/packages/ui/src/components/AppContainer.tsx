import React from 'react';
import { cn } from '../lib/utils';

const AppContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('h-screen w-screen flex flex-col bg-blue dark:bg-blue-700', className)} {...props}>
      {props.children}
    </div>
  ),
);
AppContainer.displayName = 'AppContainer';

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1 mt-3 mx-[13px] rounded-4xl bg-white dark:bg-black', className)} {...props}>
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
