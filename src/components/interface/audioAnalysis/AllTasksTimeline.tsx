import { useMemo } from 'react';
import * as d3 from 'd3';
import { Tooltip } from '@mantine/core';
import { ParticipantData } from '../../../storage/types';
import { SingleTask } from './SingleTask';
import { SingleTaskLabelLines } from './SingleTaskLabelLines';
import { useStoreSelector } from '../../../store/store';

const LABEL_GAP = 25;
const CHARACTER_SIZE = 8;

export function AllTasksTimeline({
  xScale, participantData, width, height, setSelectedTask, trialFilter,
} : {xScale: d3.ScaleLinear<number, number>, participantData: ParticipantData, width: number, height: number, setSelectedTask: (task: string) => void, trialFilter?: string | null }) {
  const { analysisTrialName: selectedTask } = useStoreSelector((state) => state);

  // Creating labels for the tasks
  const tasks = useMemo(() => {
    let currentHeight = 0;

    const sortedEntries = Object.entries(participantData.answers || {}).filter((entry) => (trialFilter ? entry[0] === trialFilter : true)).sort((a, b) => a[1].startTime - b[1].startTime);

    return sortedEntries.map((entry, i) => {
      const [name, answer] = entry;

      const prev = i > 0 ? sortedEntries[i - currentHeight - 1] : null;

      if (prev && prev[0].length * CHARACTER_SIZE + xScale(prev[1].startTime) > xScale(answer.startTime)) {
        currentHeight += 1;
      } else {
        currentHeight = 0;
      }

      return {
        line: <SingleTaskLabelLines key={name} labelHeight={currentHeight * LABEL_GAP} answer={answer} height={height} xScale={xScale} />,
        label: <SingleTask key={name} labelHeight={currentHeight * LABEL_GAP} isSelected={trialFilter ? false : selectedTask === name} setSelectedTask={setSelectedTask} answer={answer} height={height} name={name} xScale={xScale} />,
      };
    });
  }, [height, participantData.answers, selectedTask, setSelectedTask, trialFilter, xScale]);

  // Find entries of someone browsing away. Show them
  const browsedAway = useMemo(() => {
    const sortedEntries = Object.entries(participantData.answers || {}).sort((a, b) => a[1].startTime - b[1].startTime);

    return sortedEntries.map((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [name, answer] = entry;

      const browsedAwayList: [number, number][] = [];
      let currentBrowsedAway: [number, number] = [-1, -1];
      let currentState: 'visible' | 'hidden' = 'visible';
      if (answer.windowEvents) {
        for (let i = 0; i < answer.windowEvents.length; i += 1) {
          if (answer.windowEvents[i][1] === 'visibility') {
            if (answer.windowEvents[i][2] === 'hidden' && currentState === 'visible') {
              currentBrowsedAway = [answer.windowEvents[i][0], -1];
              currentState = 'hidden';
            } else if (answer.windowEvents[i][2] === 'visible' && currentState === 'hidden') {
              currentBrowsedAway[1] = answer.windowEvents[i][0];
              browsedAwayList.push(currentBrowsedAway);
              currentBrowsedAway = [-1, -1];
              currentState = 'visible';
            }
          }
        }
      }

      return (
        browsedAwayList.map((browse, i) => <Tooltip withinPortal key={i} label="Browsed away"><rect x={xScale(browse[0])} width={xScale(browse[1]) - xScale(browse[0])} y={height - 5} height={10} /></Tooltip>)
      );
    });
  }, [height, participantData, xScale]);

  return trialFilter ? null : (
    <svg style={{ width, height, overflow: 'visible' }}>
      {tasks.map((t) => t.line)}
      {tasks.map((t) => t.label)}
      {browsedAway}
    </svg>
  );
}
