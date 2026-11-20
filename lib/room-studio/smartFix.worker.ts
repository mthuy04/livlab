import { smartFix } from './smartFix';
import type { SnapView } from './snapPlacement';
import type { RoomState } from './roomState';
import type { RoomStudioProduct } from './productAdapter';
import type { TechnicalValidationResult } from '../technical-advisor/types';
self.onmessage = ({
  data,
}: {
  data: {
    state: RoomState;
    issue: TechnicalValidationResult;
    products: RoomStudioProduct[];
    views: SnapView[];
  };
}) => {
  const catalog = new Map(data.products.map((p) => [p.id, p]));
  const variants = new Map(
    data.views.map((v) => [JSON.stringify([v.product.id, v.placed.variant]), v.product])
  );
  self.postMessage(
    smartFix(
      data.state,
      data.issue,
      data.products,
      (id, v) => variants.get(JSON.stringify([id, v])) ?? catalog.get(id)
    )
  );
};
