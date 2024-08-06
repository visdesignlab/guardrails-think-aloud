/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSpring, animated } from 'react-spring';

export function AnimatedCircle({
  cx, cy, r, color,
} : {cx: number, cy: number, r: number, color: string}) {
  return <circle cx={cx} cy={cy} r={r} fill={color} />;
}
