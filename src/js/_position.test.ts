import { afterEach, describe, expect, it, vi } from 'vitest';
import { computePosition } from './_position';

// jsdom has no real layout, so getBoundingClientRect() always returns a
// zeroed rect — the flip/shift/centering math this module does is entirely
// untested unless we stub real-looking rects in. (This is exactly why the
// original cross-axis-alignment bug — the floating element was left-aligned
// to the anchor instead of centered, so an arrow drawn at the box's own
// midpoint pointed away from the anchor — shipped without a failing test.)
function rect(r: Partial<DOMRect>): DOMRect {
  return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON() {}, ...r } as DOMRect;
}

function mockEl(r: Partial<DOMRect>): HTMLElement {
  const el = document.createElement('div');
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(r));
  return el;
}

function setViewport(width: number, height: number): void {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('innerHeight', height);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('computePosition', () => {
  it('centers a "bottom" placement on the anchor\'s horizontal midpoint', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 100, right: 180, top: 50, bottom: 70, width: 80, height: 20 });
    const floating = mockEl({ width: 120, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'bottom', offset: 8 });

    expect(r.placement).toBe('bottom');
    expect(r.top).toBe(78); // anchor.bottom + offset
    expect(r.left).toBe(80); // anchor midpoint (140) - floating half-width (60)
    // The arrow sits at the anchor's midpoint relative to the floating box's
    // own left edge — this is the assertion that would have caught the bug.
    expect(r.arrowOffset).toBe(60);
  });

  it('centers a "top" placement on the anchor\'s horizontal midpoint', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 300, right: 340, top: 200, bottom: 220, width: 40, height: 20 });
    const floating = mockEl({ width: 200, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'top', offset: 6 });

    expect(r.placement).toBe('top');
    expect(r.top).toBe(154); // anchor.top - offset - floating.height
    expect(r.left).toBe(220); // anchor midpoint (320) - floating half-width (100)
    expect(r.arrowOffset).toBe(100); // dead center of the floating box
  });

  it('flips from bottom to top when the bottom side lacks room but the top has more', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 100, right: 180, top: 700, bottom: 780, width: 80, height: 80 });
    const floating = mockEl({ width: 100, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'bottom', offset: 8 });

    expect(r.placement).toBe('top');
    expect(r.top).toBe(652); // anchor.top - offset - floating.height
  });

  it('does not flip when the opposite side has no more room than the preferred side', () => {
    setViewport(1000, 200);
    // Anchor fills most of a short viewport — neither side has much room, and
    // top and bottom are roughly symmetric, so the preferred side should win.
    const anchor = mockEl({ left: 100, right: 180, top: 90, bottom: 110, width: 80, height: 20 });
    const floating = mockEl({ width: 100, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'bottom', offset: 8 });

    expect(r.placement).toBe('bottom');
  });

  it('shifts (clamps) the cross-axis into the viewport instead of overflowing', () => {
    setViewport(400, 800);
    // Anchor near the right edge — a centered 200px-wide floating box would
    // overflow past the viewport's right edge.
    const anchor = mockEl({ left: 370, right: 390, top: 50, bottom: 70, width: 20, height: 20 });
    const floating = mockEl({ width: 200, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'bottom', offset: 8, padding: 8 });

    expect(r.left).toBe(192); // clamped to vw(400) - width(200) - padding(8)
    // The arrow still tracks the anchor's real midpoint (380), inset from
    // the floating box's own edges rather than snapping back to center.
    expect(r.arrowOffset).toBe(188); // 380 - 192, within [10, 190]
  });

  it('leans a "top-left" corner placement left of the anchor (right edges match)', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 300, right: 340, top: 200, bottom: 220, width: 40, height: 20 });
    const floating = mockEl({ width: 200, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'top-left', offset: 6 });

    expect(r.placement).toBe('top-left');
    expect(r.left).toBe(140); // floating's right edge (340) matches the anchor's right edge
    expect(r.arrowOffset).toBe(180); // anchor midpoint (320) - floating left (140)
  });

  it('leans a "bottom-right" corner placement right of the anchor (left edges match)', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 300, right: 340, top: 200, bottom: 220, width: 40, height: 20 });
    const floating = mockEl({ width: 200, height: 40 });

    const r = computePosition(anchor, floating, { placement: 'bottom-right', offset: 6 });

    expect(r.placement).toBe('bottom-right');
    expect(r.left).toBe(300); // floating's left edge matches the anchor's left edge
    expect(r.arrowOffset).toBe(20); // anchor midpoint (320) - floating left (300)
  });

  it('centers a "right" placement on the anchor\'s vertical midpoint', () => {
    setViewport(1000, 800);
    const anchor = mockEl({ left: 100, right: 140, top: 300, bottom: 320, width: 40, height: 20 });
    const floating = mockEl({ width: 80, height: 60 });

    const r = computePosition(anchor, floating, { placement: 'right', offset: 8 });

    expect(r.placement).toBe('right');
    expect(r.left).toBe(148); // anchor.right + offset
    expect(r.top).toBe(280); // anchor midpoint (310) - floating half-height (30)
    expect(r.arrowOffset).toBe(30);
  });
});
