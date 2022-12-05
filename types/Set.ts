/**
 * A generic representation of a ConfigSet that contains a path hierarchy to differentiate Config values and enable inheritance
 */
export interface Set {
  path: string;
  hierarchy: string[];
}
