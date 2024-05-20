import React from 'react';

const AppContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} className="h-screen w-screen flex flex-col bg-blue dark:bg-blue-700" {...props}>
    {props.children}
  </div>
));
AppContainer.displayName = 'AppContainer';

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} className="flex-1 mt-3 mx-[13px] rounded-4xl bg-white dark:bg-black" {...props}>
    {props.children}
  </div>
));
Header.displayName = 'Header';

const Footer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} className="h-[74px]" {...props}>
    {props.children}
  </div>
));
Footer.displayName = 'Footer';

export { AppContainer, Header, Footer };
