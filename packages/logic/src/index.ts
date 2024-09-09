import { evaluate } from '@configu/sdk';

console.log(evaluate('1 + 1 - a', { a: 7 }));
