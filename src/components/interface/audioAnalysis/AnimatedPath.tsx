import { useSpring, animated } from 'react-spring';

export function AnimatedPath({ d } : {d: string}) {
  return <path d={d} stroke="cornflowerblue" fill="none" strokeWidth={1} opacity={1} />;
}
