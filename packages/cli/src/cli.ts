import { run } from '.';

console.log(process.argv);
console.log('----------');
run(process.argv.slice(2));
