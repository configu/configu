import { ConfigStore, Expression } from '@configu/sdk';
import { Registry } from './Registry';
import { ConfiguFile } from './ConfiguFile';

const test = async () => {
  // await Registry.register('../../../module.js');
  await Registry.register('./module.js');
  // await Registry.register('./stub/module.js');

  // console.log(Registry.store.keys());

  // console.log(Expression.functions.get('isInt'));
  // const expression = 'isInt({ gt: 5 })';
  // const context = { $: { value: '6' }, _: '6' };

  // try {
  //   const exp = Expression.parse(expression);
  //   // console.log(exp);
  //   // console.log(exp.returnType, exp.toString());

  //   const res = exp.tryEvaluate(context);
  //   console.log(res, typeof res.value);
  // } catch (error) {
  //   console.error('Error:', error);
  // }

  // const file = await ConfiguFile.load('packages/common/src/.configu');
  // console.log(file.contents.stores);

  // eslint-disable-next-line no-template-curly-in-string, prettier/prettier, no-useless-escape
  const res = Expression.parse('`${x+5} ${x > 5 ? \\`lg-${x}\\` : \\`lt-${x}\\`}`').tryEvaluate({ x: 15 });
  console.log(res.value);
};

test();

const x = 14;
const str = `${x} ${`${x + 5}rannn`}`;
console.log(str);
