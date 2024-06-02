import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import style from 'react-syntax-highlighter/dist/cjs/styles/prism/a11y-dark';
import { cn } from '../lib/utils';

SyntaxHighlighter.registerLanguage('bash', bash);

export interface CodeSnippetProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  topRightElement?: React.ReactNode;
}

const CodeSnippet = React.forwardRef<HTMLDivElement, CodeSnippetProps>(({ code, className, topRightElement }, ref) => {
  return (
    <div
      className={cn(
        'dark:border-gray relative h-full min-h-[52px] w-full rounded-xl bg-gray-900 p-3 dark:border',
        className,
      )}
      ref={ref}
    >
      <SyntaxHighlighter
        language="bash"
        children={code}
        style={{
          ...style,
          string: {
            color: '#00B268',
          },
          builtin: {
            color: 'white',
          },
          punctuation: {
            color: '#00D5FF',
          },
          operator: {
            color: '#00D5FF',
          },
        }}
        customStyle={{
          backgroundColor: 'transparent',
          padding: 0,
          margin: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'IBM Plex Mono',
            fontSize: '13px',
            fontWeight: 400,
          },
        }}
      />
      {topRightElement && <div className="absolute right-3.5 top-3.5">{topRightElement}</div>}
    </div>
  );
});
CodeSnippet.displayName = 'CodeSnippet';

export { CodeSnippet };
