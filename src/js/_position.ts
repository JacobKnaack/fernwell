/**
 * Internal positioning helpers shared by popover.ts and tooltip.ts. Not part
 * of the public API — not re-exported from index.ts.
 *
 * Both callers use `position: fixed`, so all math here is viewport-relative
 * (matching `getBoundingClientRect()`) rather than document-relative.
 */
export type Side = 'top' | 'bottom' | 'left' | 'right';

/**
 * `top` / `bottom` / `left` / `right` center the floating element on the
 * anchor's cross-axis midpoint. `top-left` / `top-right` / `bottom-left` /
 * `bottom-right` keep the anchor above/below but shift the floating element
 * so it leans toward that corner instead of centering — useful to steer a
 * panel away from something else on the page (another fixed control, a
 * viewport edge) without losing the "above/below the trigger" placement.
 *
 * "Lean right" means the floating element's LEFT edge lines up with the
 * anchor's left edge, so the (usually wider) box extends further right of
 * the anchor than a centered box would; "lean left" mirrors that off the
 * anchor's right edge.
 */
export type Placement = Side | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Which edge of the anchor the floating element's near edge lines up with,
 * on the cross axis — 'start' leans the box toward increasing x/y (right/
 * down), 'end' leans it toward decreasing x/y (left/up). */
type Align = 'center' | 'start' | 'end';

export interface PositionOptions {
  /** Preferred placement. */
  placement?: Placement;
  /** Gap between anchor and floating element, px. */
  offset?: number;
  /** Minimum distance from the viewport edge, px. */
  padding?: number;
}

export interface PositionResult {
  /** Final placement, after a possible flip. */
  placement: Placement;
  top: number;
  left: number;
  /**
   * Distance, in px, from the floating element's near edge (left, for a
   * top/bottom placement; top, for a left/right placement) to the anchor's
   * center — for positioning an optional arrow so it keeps pointing at the
   * anchor even after the cross-axis got clamped to stay in the viewport.
   * Already inset from the floating element's own edges so the arrow never
   * overhangs a rounded corner.
   */
  arrowOffset: number;
}

const OPPOSITE_SIDE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const ARROW_INSET = 10; // px — keeps the arrow clear of the floating box's rounded corners

function parsePlacement(p: Placement): { side: Side; align: Align } {
  switch (p) {
    // "-right" leans the box right → its left edge pins to the anchor's
    // left edge (`start`); "-left" leans it left → right edges pin (`end`).
    case 'top-left':
      return { side: 'top', align: 'end' };
    case 'top-right':
      return { side: 'top', align: 'start' };
    case 'bottom-left':
      return { side: 'bottom', align: 'end' };
    case 'bottom-right':
      return { side: 'bottom', align: 'start' };
    default:
      return { side: p, align: 'center' };
  }
}

const ALIGN_SUFFIX: Record<Exclude<Align, 'center'>, 'left' | 'right'> = { start: 'right', end: 'left' };

function toPlacement(side: Side, align: Align): Placement {
  return align === 'center' ? side : (`${side}-${ALIGN_SUFFIX[align]}` as Placement);
}

function mainAxisSpace(side: Side, anchor: DOMRect, vw: number, vh: number): number {
  switch (side) {
    case 'top':
      return anchor.top;
    case 'bottom':
      return vh - anchor.bottom;
    case 'left':
      return anchor.left;
    case 'right':
      return vw - anchor.right;
  }
}

function mainAxisCoord(side: Side, anchor: DOMRect, floating: DOMRect, offset: number): number {
  switch (side) {
    case 'top':
      return anchor.top - offset - floating.height;
    case 'bottom':
      return anchor.bottom + offset;
    case 'left':
      return anchor.left - offset - floating.width;
    case 'right':
      return anchor.right + offset;
  }
}

/** Cross-axis coordinate (the floating element's left, for a horizontal
 * anchor span; or top, for a vertical one) implementing `align`. */
function crossAxisCoord(align: Align, anchorStart: number, anchorSize: number, floatingSize: number): number {
  switch (align) {
    case 'start':
      return anchorStart;
    case 'end':
      return anchorStart + anchorSize - floatingSize;
    case 'center':
      return anchorStart + anchorSize / 2 - floatingSize / 2;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max > min ? max : min);
}

/**
 * Positions `floating` relative to `anchor`: flips to the opposite side when
 * the preferred side doesn't fit and the opposite side has more room (a
 * 2-entry fallback, not a 4-way rotation — both callers are single-edge
 * anchored, unlike a corner-anchored menu), and clamps the cross-axis into
 * the viewport ("shift") rather than flipping it.
 *
 * The cross-axis is centered on the anchor by default (`align: 'center'`,
 * implied by a bare `top`/`bottom`/`left`/`right` placement) — the corner
 * placements (`top-left`, etc.) opt into edge-alignment instead. Centering
 * is what makes an arrow drawn at the floating element's own midpoint line
 * up with the anchor; `arrowOffset` carries the exact anchor-relative
 * position so the arrow still lines up even when a corner placement or a
 * viewport clamp shifts the box off-center.
 */
export function computePosition(anchor: HTMLElement, floating: HTMLElement, opts: PositionOptions = {}): PositionResult {
  const preferred = opts.placement ?? 'bottom';
  const offset = opts.offset ?? 8;
  const padding = opts.padding ?? 8;

  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const { side: preferredSide, align } = parsePlacement(preferred);
  const oppositeSide = OPPOSITE_SIDE[preferredSide];
  const needed = preferredSide === 'top' || preferredSide === 'bottom' ? f.height : f.width;

  const side =
    mainAxisSpace(preferredSide, a, vw, vh) - offset < needed &&
    mainAxisSpace(oppositeSide, a, vw, vh) - offset > mainAxisSpace(preferredSide, a, vw, vh) - offset
      ? oppositeSide
      : preferredSide;

  let top: number;
  let left: number;
  let arrowOffset: number;

  if (side === 'top' || side === 'bottom') {
    top = mainAxisCoord(side, a, f, offset);
    left = clamp(crossAxisCoord(align, a.left, a.width, f.width), padding, vw - f.width - padding);
    arrowOffset = clamp(a.left + a.width / 2 - left, ARROW_INSET, Math.max(f.width - ARROW_INSET, ARROW_INSET));
  } else {
    left = mainAxisCoord(side, a, f, offset);
    top = clamp(crossAxisCoord('center', a.top, a.height, f.height), padding, vh - f.height - padding);
    arrowOffset = clamp(a.top + a.height / 2 - top, ARROW_INSET, Math.max(f.height - ARROW_INSET, ARROW_INSET));
  }

  return { placement: toPlacement(side, align), top, left, arrowOffset };
}

/**
 * Fires `onDismiss` only when a click lands outside every element in
 * `anchors` — generalizes modal.ts's `bindOutsideClickToClose` (which checks
 * a single backdrop) to an arbitrary set of "not outside" elements (e.g. a
 * popover's trigger AND its panel).
 *
 * Guards the same false positive: a browser's `click` fires on the nearest
 * common ancestor of mousedown and mouseup, so a text-selection drag that
 * starts inside an anchor and ends outside it would otherwise look like an
 * outside click. Close only when BOTH mousedown and click landed outside.
 */
export function bindOutsideDismiss(anchors: HTMLElement[], onDismiss: () => void): () => void {
  const isOutside = (target: EventTarget | null): boolean => !anchors.some((el) => el.contains(target as Node));
  let downOutside = false;

  const onMousedown = (e: MouseEvent) => {
    downOutside = isOutside(e.target);
  };
  const onClick = (e: MouseEvent) => {
    if (downOutside && isOutside(e.target)) onDismiss();
  };

  document.addEventListener('mousedown', onMousedown, true);
  document.addEventListener('click', onClick, true);

  return () => {
    document.removeEventListener('mousedown', onMousedown, true);
    document.removeEventListener('click', onClick, true);
  };
}
