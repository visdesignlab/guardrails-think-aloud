/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo } from 'react';

const margin = {
  top: 5,
  left: 5,
  right: 5,
  bottom: 5,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TranscriptLines({
  transcriptLines, xScale, startTime, currentShownTranscription,
} : {transcriptLines: {start: number, end: number, lineStart: number, lineEnd: number}[], xScale: d3.ScaleLinear<number, number>; startTime: number; currentShownTranscription: number}) {
  const lines = useMemo(() => transcriptLines.map((line) => <line key={line.start} stroke={currentShownTranscription >= line.lineStart && currentShownTranscription <= line.lineEnd ? 'cornflowerblue' : 'lightgray'} strokeWidth={5} y1={margin.top} y2={margin.top} x1={xScale(startTime + line.start * 1000) + 2} x2={xScale(startTime + line.end * 1000) - 2} />), [currentShownTranscription, startTime, transcriptLines, xScale]);

  return (
    <svg style={{ width: '100%', height: '30px' }}>
      {lines}
    </svg>
  );
}
