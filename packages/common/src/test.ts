import { ConfigStore, Expression } from '@configu/sdk';
import { Registry } from './Registry';

const test = async () => {
  // await Registry.register('../../../module.js');
  await Registry.register('./module.js');

  // console.log(Registry.store.keys());

  // console.log(Expression.functions.get('isInt'));
  const expression = 'isInt({ gt: 5 })';
  const context = { $: { value: '6' }, _: '6' };

  try {
    const exp = Expression.parse(expression);
    // console.log(exp);
    // console.log(exp.returnType, exp.toString());

    const res = exp.tryEvaluate(context);
    console.log(res, typeof res.value);
  } catch (error) {
    console.error('Error:', error);
  }
};

test();
