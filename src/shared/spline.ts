/** Monotone cubic Hermite spline — no overshoot between data points */
export function monotoneCubicPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const first = points[0];
  const second = points[1];
  if (!first || !second) return "";
  if (points.length === 2) return `M ${first.x} ${first.y} L ${second.x} ${second.y}`;

  const n = points.length;
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    dx.push(b.x - a.x);
    dy.push(b.y - a.y);
    m.push((b.y - a.y) / (b.x - a.x));
  }

  const tangents: number[] = [m[0] ?? 0];
  for (let i = 1; i < n - 1; i++) {
    const mPrev = m[i - 1] ?? 0;
    const mCur = m[i] ?? 0;
    const dxPrev = dx[i - 1] ?? 0;
    const dxCur = dx[i] ?? 0;
    if (mPrev * mCur <= 0) {
      tangents.push(0);
    } else {
      tangents.push(
        (3 * (dxPrev + dxCur)) /
          ((2 * dxCur + dxPrev) / mPrev + (dxCur + 2 * dxPrev) / mCur),
      );
    }
  }
  tangents.push(m[n - 2] ?? 0);

  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < n - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const seg = (dx[i] ?? 0) / 3;
    const tA = tangents[i] ?? 0;
    const tB = tangents[i + 1] ?? 0;
    d += ` C ${a.x + seg} ${a.y + tA * seg}, ${b.x - seg} ${b.y - tB * seg}, ${b.x} ${b.y}`;
  }
  return d;
}
