import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import * as d3 from 'd3';
import { Stack } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import { ParticipantData } from '../../../storage/types';
import { SingleTaskProvenance } from './SingleTaskProvenance';

const margin = {
  left: 5, top: 0, right: 5, bottom: 0,
};
export function SingleTaskTimeline({
  xScale, participantData, width, height, currentNode, setCurrentNode, playTime, setPlayTime, isPlaying, setIsPlaying, setSelectedTask,
} : {xScale: d3.ScaleLinear<number, number>, participantData: ParticipantData, width: number, height: number, currentNode: string | null, setCurrentNode: (node: string) => void, isPlaying: boolean, setIsPlaying: (b: boolean) => void, playTime: number, setPlayTime: (n: number, p: number) => void, setSelectedTask: (s: string) => void}) {
  const totalLength = useMemo(() => xScale.domain()[1] - xScale.domain()[0], [xScale]);

  const { trialName } = useParams();
  // useEffect(() => {
  //   if (isPlaying && playTime <= xScale.domain()[1]) {
  //     if (playTime + xScale.domain()[0] > allTaskTimes[taskIndex + 1].time) {
  //       setTaskIndex(taskIndex + 1);
  //       setSelectedTask(allTaskTimes[taskIndex + 1].name);
  //       setProvNodeIndex(0);
  //     } else if (playTime + xScale.domain()[0] > allTaskTimes[taskIndex]?.nodes[provNodeIndex + 1]?.time) {
  //       setProvNodeIndex(provNodeIndex + 1);
  //       setCurrentNode(allTaskTimes[taskIndex].nodes[provNodeIndex + 1].name);
  //     }
  //   }
  // }, [allTaskTimes, isPlaying, playTime, provNodeIndex, setCurrentNode, setSelectedTask, taskIndex, xScale]);

  // useEffect(() => {
  //   setPlayTime(xScale.domain()[0], (xScale.domain()[0] - wholeXScale.domain()[0]) / totalLength);
  // }, [selectedTask, setPlayTime, totalLength, wholeXScale, xScale]);

  // useEffect(() => {
  //   setTaskIndex(allTaskTimes.indexOf(allTaskTimes.find((task) => task.name === selectedTask)!));
  // }, [selectedTask, allTaskTimes]);

  const currentNodeCallback = useCallback((node: string, nodeTime: number, taskName: string) => {
    setPlayTime(nodeTime, (nodeTime - xScale.domain()[0]) / totalLength);

    setCurrentNode(node);
  }, [setCurrentNode, setPlayTime, totalLength, xScale]);

  return (
    <Stack>
      <svg style={{ width, height }}>
        <line stroke="black" strokeWidth={1} x1={margin.left} x2={width + margin.left} y1={height / 2} y2={height / 2} />
        {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left} x2={wholeXScale(participantData.answers[selectedTask].startTime)} y1={height / 2} y2={0}></line> : null } */}
        {/* {selectedTask ? <AnimatedPath d={`M 0,${height/2} C 0,0 ${wholeXScale(participantData.answers[selectedTask].startTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].startTime)},0`}></AnimatedPath> : null }
            {selectedTask ? <AnimatedPath d={`M ${width},${height/2} C ${width},0 ${wholeXScale(participantData.answers[selectedTask].endTime)},${height/4} ${wholeXScale(participantData.answers[selectedTask].endTime)},0`}></AnimatedPath> : null } */}
        {/* {selectedTask ? <line stroke="cornflowerblue" strokeWidth={1} opacity={1} x1={margin.left + width} x2={wholeXScale(participantData.answers[selectedTask].endTime)} y1={height / 2} y2={0}></line> : null } */}

        {Object.entries(participantData.answers).map((entry) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [name, answer] = entry;

          return <SingleTaskProvenance key={name} taskName={name} answer={answer} height={height} currentNode={currentNode} setCurrentNode={currentNodeCallback} xScale={xScale} />;
        })}

      </svg>
    </Stack>
  );
}
