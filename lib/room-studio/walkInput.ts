const directions: Record<string, string> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

/** Transient navigation input, shared between DOM gestures and the R3F frame loop. */
export class WalkInput {
  private keys = new Set<string>();
  private dx = 0;
  private dy = 0;
  private since = 0;
  private wake: (() => void) | null = null;
  connect(wake: (() => void) | null) {
    this.wake = wake;
  }
  clear() {
    this.keys.clear();
    this.dx = 0;
    this.dy = 0;
    this.since = performance.now();
  }
  press(key: string) {
    if (!(key in directions) && !['up', 'down', 'left', 'right'].includes(key)) return false;
    if (!this.keys.size) this.since = performance.now();
    this.keys.add(key);
    this.wake?.();
    return true;
  }
  release(key: string) {
    this.keys.delete(key);
  }
  look(dx: number, dy: number) {
    this.dx += dx;
    this.dy += dy;
    this.wake?.();
  }
  read(delta: number, now: number) {
    const has = (a: string, b: string, c: string) =>
      Number(this.keys.has(a) || this.keys.has(b) || this.keys.has(c));
    const result = {
      dx: this.dx,
      dy: this.dy,
      side: has('right', 'KeyD', 'ArrowRight') - has('left', 'KeyA', 'ArrowLeft'),
      forward: has('up', 'KeyW', 'ArrowUp') - has('down', 'KeyS', 'ArrowDown'),
      elapsed: Math.max(0, Math.min(delta, (now - this.since) / 1000, 0.1)),
    };
    this.dx = 0;
    this.dy = 0;
    this.since = now;
    return result;
  }
}
