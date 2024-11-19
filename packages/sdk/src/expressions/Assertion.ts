// Vitest Source:
// https://github.com/vitest-dev/vitest/tree/main/packages/expect
// https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/chai/setup.ts
// https://github.com/vitest-dev/vitest/blob/main/packages/vitest/src/integrations/chai/index.ts
import * as chai from 'chai';
import Subset from 'chai-subset';
import { JestAsymmetricMatchers, JestChaiExpect, JestExtend } from '@vitest/expect';
// import * as matchers from 'jest-extended';

chai.use(JestExtend);
chai.use(JestChaiExpect);
chai.use(Subset);
chai.use(JestAsymmetricMatchers);
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-expect-error untyped
// chai.expect.extend(matchers);

// API:
// https://vitest.dev/guide/features.html#chai-and-jest-expect-compatibility
// https://www.chaijs.com/api/
// https://jestjs.io/docs/expect
// https://jest-extended.jestcommunity.dev/docs/matchers
// todo: verify return type of assert, expect, and should and make them throw an error
export { assert } from 'chai'; // tdd
export { expect, should } from 'chai'; // bdd
