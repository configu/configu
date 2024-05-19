import React from 'react';

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 16;

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M13.0202 4.31333C13.2155 4.50859 13.2155 4.82518 13.0202 5.02044L6.35356 11.6871C6.1583 11.8824 5.84172 11.8824 5.64646 11.6871L2.97979 9.02044C2.78453 8.82518 2.78453 8.50859 2.97979 8.31333C3.17505 8.11807 3.49163 8.11807 3.6869 8.31333L6.00001 10.6264L12.3131 4.31333C12.5084 4.11807 12.825 4.11807 13.0202 4.31333Z"
        />
      </g>
    </svg>
  );
};

export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M3.46976 5.46946C3.76265 5.17656 4.23753 5.17656 4.53042 5.46946L8.00009 8.93913L11.4698 5.46946C11.7627 5.17656 12.2375 5.17656 12.5304 5.46946C12.8233 5.76235 12.8233 6.23722 12.5304 6.53012L8.53042 10.5301C8.23753 10.823 7.76265 10.823 7.46976 10.5301L3.46976 6.53012C3.17687 6.23722 3.17687 5.76235 3.46976 5.46946Z"
        />
      </g>
    </svg>
  );
};
export const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M7.46976 5.46946C7.76265 5.17656 8.23753 5.17656 8.53042 5.46946L12.5304 9.46946C12.8233 9.76235 12.8233 10.2372 12.5304 10.5301C12.2375 10.823 11.7627 10.823 11.4698 10.5301L8.00009 7.06045L4.53042 10.5301C4.23753 10.823 3.76265 10.823 3.46976 10.5301C3.17687 10.2372 3.17687 9.76235 3.46976 9.46946L7.46976 5.46946Z"
        />
      </g>
    </svg>
  );
};
