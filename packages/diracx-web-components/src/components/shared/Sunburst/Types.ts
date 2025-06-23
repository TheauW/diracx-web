import { HierarchyRectangularNode } from "d3-hierarchy";

/**
 * Data structure received by the Sunburst and the Treemap
 */
export type Tree = {
  name: string;
  value?: number;
  children?: Tree[];
};

/**
 * Type manipulated by the Sunburst and the Treemap
 */
export interface Node extends HierarchyRectangularNode<Tree> {
  current?: Node; // For the Sunburst
  leafUid?: string; // For the Treemap
  clipUid?: string; // For the treemap
}

export type Data = {
  (key: string): string | number | boolean;
};
