import 'zx/globals';
import lodash from 'lodash';

export const PAGE_EXT = '.mdx';

export const ROOT_PATH = path.join(__dirname, '..', '..');
export const DOCS_ROOT_PATH = path.join(__dirname, '..');
export const MINT_PATH = path.join(ROOT_PATH, 'mint.json');

export const confirm = async (q) => {
  const answer = await question(`${q} y(es)/n(o) `); // Y(all)/N(none)/q(uit)
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    return true;
  } else if (answer.toLowerCase() === 'no' || answer.toLowerCase() === 'n') {
    return false;
  } else {
    // Recurse to re-ask the same question if input is invalid
    console.log("Invalid input");
    return confirm(q);
  }
}

export const _ = lodash;
