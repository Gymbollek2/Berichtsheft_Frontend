import { CHILD_KIND, REQUIRED_PARENT_KIND } from './models';
import { treeOrder } from './utils';

describe('Lernziel-Hierarchie', () => {
  it('Richtlernziel hat kein übergeordnetes Lernziel', () => {
    expect(REQUIRED_PARENT_KIND.KIND_GENERAL).toBeNull();
  });

  it('Groblernziel steht unter Richtlernziel, Feinlernziel unter Groblernziel', () => {
    expect(REQUIRED_PARENT_KIND.KIND_BROAD).toBe('KIND_GENERAL');
    expect(REQUIRED_PARENT_KIND.KIND_SPECIFIC).toBe('KIND_BROAD');
    expect(CHILD_KIND.KIND_SPECIFIC).toBeNull();
  });

  it('ordnet Eltern vor Kindern an', () => {
    const items = [
      { id: 3, parentId: 2 },
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
    ];
    const order = treeOrder(items, (i) => i.id, (i) => i.parentId);
    expect(order.map((o) => [o.item.id, o.depth])).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
  });
});
