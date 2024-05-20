import React from 'react';

const DEFAULT_WIDTH = 16;
const DEFAULT_HEIGHT = 16;
const DEFAULT_VIEWBOX = `0 0 ${DEFAULT_WIDTH} ${DEFAULT_HEIGHT}`;

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
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
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
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

export const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M10.5304 3.46946C10.8233 3.76235 10.8233 4.23722 10.5304 4.53012L7.06075 7.99979L10.5304 11.4695C10.8233 11.7624 10.8233 12.2372 10.5304 12.5301C10.2375 12.823 9.76265 12.823 9.46976 12.5301L5.46976 8.53012C5.17687 8.23722 5.17687 7.76235 5.46976 7.46946L9.46976 3.46946C9.76265 3.17656 10.2375 3.17656 10.5304 3.46946Z"
        />
      </g>
    </svg>
  );
};

export const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M5.46976 3.46946C5.76265 3.17656 6.23753 3.17656 6.53042 3.46946L10.5304 7.46946C10.8233 7.76235 10.8233 8.23722 10.5304 8.53012L6.53042 12.5301C6.23753 12.823 5.76265 12.823 5.46976 12.5301C5.17687 12.2372 5.17687 11.7624 5.46976 11.4695L8.93943 7.99979L5.46976 4.53012C5.17687 4.23722 5.17687 3.76235 5.46976 3.46946Z"
        />
      </g>
    </svg>
  );
};

export const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
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

export const DarkModeIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          fill={'currentColor'}
          d="M5.77946 1.57521C5.92657 1.66638 6.01607 1.82714 6.01607 2.00021C6.01607 4.75969 6.70019 6.73052 7.98494 8.01528C9.26969 9.30003 11.2405 9.98415 14 9.98415C14.1731 9.98415 14.3338 10.0737 14.425 10.2208C14.5162 10.3679 14.5248 10.5517 14.4478 10.7067C13.3309 12.954 11.011 14.5002 8.32893 14.5002C4.55742 14.5002 1.5 11.4428 1.5 7.67128C1.5 4.98926 3.0462 2.6693 5.29356 1.55246C5.44855 1.47543 5.63234 1.48404 5.77946 1.57521ZM5.0381 2.85938C3.50481 3.91004 2.5 5.67367 2.5 7.67128C2.5 10.8905 5.1097 13.5002 8.32893 13.5002C10.3266 13.5002 12.0902 12.4954 13.1408 10.9621C10.6389 10.8306 8.66241 10.107 7.27783 8.72238C5.89326 7.3378 5.16967 5.36135 5.0381 2.85938Z"
        />
      </g>
    </svg>
  );
};

export const LightModeIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} viewBox={DEFAULT_VIEWBOX} {...props}>
      <g fill={'none'}>
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M3.50002 8.00022C3.50002 5.51494 5.51474 3.50022 8.00002 3.50022C10.4853 3.50022 12.5 5.51494 12.5 8.00022C12.5 10.4855 10.4853 12.5002 8.00002 12.5002C5.51474 12.5002 3.50002 10.4855 3.50002 8.00022ZM8.00002 4.50022C6.06702 4.50022 4.50002 6.06722 4.50002 8.00022C4.50002 9.93321 6.06702 11.5002 8.00002 11.5002C9.93301 11.5002 11.5 9.93321 11.5 8.00022C11.5 6.06722 9.93301 4.50022 8.00002 4.50022Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M14.1667 8.00022C14.1667 7.72408 14.3905 7.50022 14.6667 7.50022H15.3334C15.6095 7.50022 15.8334 7.72408 15.8334 8.00022C15.8334 8.27636 15.6095 8.50022 15.3334 8.50022H14.6667C14.3905 8.50022 14.1667 8.27636 14.1667 8.00022Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M8.00002 0.166885C8.27616 0.166885 8.50002 0.390743 8.50002 0.666885V1.33355C8.50002 1.60969 8.27616 1.83355 8.00002 1.83355C7.72388 1.83355 7.50002 1.60969 7.50002 1.33355V0.666885C7.50002 0.390743 7.72388 0.166885 8.00002 0.166885Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M8.00002 14.1669C8.27616 14.1669 8.50002 14.3907 8.50002 14.6669V15.3336C8.50002 15.6097 8.27616 15.8336 8.00002 15.8336C7.72388 15.8336 7.50002 15.6097 7.50002 15.3336V14.6669C7.50002 14.3907 7.72388 14.1669 8.00002 14.1669Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M12.3131 12.3133C12.5084 12.1181 12.825 12.1181 13.0202 12.3133L13.6869 12.98C13.8822 13.1753 13.8822 13.4918 13.6869 13.6871C13.4916 13.8824 13.1751 13.8824 12.9798 13.6871L12.3131 13.0204C12.1179 12.8252 12.1179 12.5086 12.3131 12.3133Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M13.6869 2.31333C13.8822 2.50859 13.8822 2.82518 13.6869 3.02044L13.0202 3.68711C12.825 3.88237 12.5084 3.88237 12.3131 3.68711C12.1179 3.49184 12.1179 3.17526 12.3131 2.98L12.9798 2.31333C13.1751 2.11807 13.4916 2.11807 13.6869 2.31333Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M3.68691 12.3133C3.88217 12.5086 3.88217 12.8252 3.68691 13.0204L3.02024 13.6871C2.82498 13.8824 2.5084 13.8824 2.31313 13.6871C2.11787 13.4918 2.11787 13.1753 2.31313 12.98L2.9798 12.3133C3.17506 12.1181 3.49164 12.1181 3.68691 12.3133Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M2.31313 2.31333C2.5084 2.11807 2.82498 2.11807 3.02024 2.31333L3.68691 2.98C3.88217 3.17526 3.88217 3.49184 3.68691 3.68711C3.49164 3.88237 3.17506 3.88237 2.9798 3.68711L2.31313 3.02044C2.11787 2.82518 2.11787 2.50859 2.31313 2.31333Z"
          fill={'currentColor'}
        />
        <path
          fillRule={'evenodd'}
          clipRule={'evenodd'}
          d="M0.166687 8.00022C0.166687 7.72408 0.390545 7.50022 0.666687 7.50022H1.33335C1.6095 7.50022 1.83335 7.72408 1.83335 8.00022C1.83335 8.27636 1.6095 8.50022 1.33335 8.50022H0.666687C0.390545 8.50022 0.166687 8.27636 0.166687 8.00022Z"
          fill={'currentColor'}
        />
      </g>
    </svg>
  );
};
