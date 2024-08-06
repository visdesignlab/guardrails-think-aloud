/* eslint-disable @typescript-eslint/no-explicit-any */

import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Anchor, Center, Group, Stack, Text,
} from '@mantine/core';
import { useMemo } from 'react';
import { useResizeObserver } from '@mantine/hooks';
import * as d3 from 'd3';
import { AllTasksTimeline } from './AllTasksTimeline';
import { ParticipantData } from '../../../storage/types';
import { getSequenceFlatMap } from '../../../utils/getSequenceFlatMap';

const margin = {
  left: 5, top: 0, right: 5, bottom: 0,
};

function humanReadableDuration(msDuration: number): string {
  const h = Math.floor(msDuration / 1000 / 60 / 60);
  const m = Math.floor((msDuration / 1000 / 60 / 60 - h) * 60);
  const s = Math.floor(((msDuration / 1000 / 60 / 60 - h) * 60 - m) * 60);

  // To get time format 00:00:00
  const seconds: string = s < 10 ? `0${s}` : `${s}`;
  const minutes: string = m < 10 ? `0${m}` : `${m}`;
  const hours: string = h < 10 ? `0${h}` : `${h}`;

  return `${hours}h ${minutes}m ${seconds}s`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisSingleParticipant({ participant, maxDuration } : {participant: ParticipantData, maxDuration?: number | undefined}) {
  const navigate = useNavigate();

  const current = useLocation();
  const duration = useMemo(() => {
    if (!participant.answers || Object.entries(participant.answers).length === 0) {
      return 0;
    }

    const answersSorted = Object.values(participant.answers).sort((a, b) => a.startTime - b.startTime);

    return new Date(answersSorted[answersSorted.length - 1].endTime - (answersSorted[1] ? answersSorted[1].startTime : 0)).getTime();
  }, [participant]);

  const [ref, { width }] = useResizeObserver();
  const totalInteractions = useMemo(() => {
    if (!participant.answers || Object.entries(participant.answers).length === 0) {
      return 0;
    }

    const answersSorted = d3.sum(Object.values(participant.answers).map((a) => (a.provenanceGraph ? Object.keys(a.provenanceGraph.nodes).length : 0)));

    return answersSorted;
  }, [participant]);

  const xScale = useMemo(() => {
    if (!participant) {
      return null;
    }
    const allStartTimes = Object.values(participant.answers || {}).map((answer) => [answer.startTime, answer.endTime]).flat();

    const extent = d3.extent(allStartTimes) as [number, number];

    const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(extent).clamp(true);

    return scale;
  }, [participant, width]);

  return (
    <Center>
      <Stack gap={25} ref={ref} style={{ width: '75%' }} key={participant.participantId}>
        <Group justify="space-between">
          <Anchor
            size="25px"
            component={Link}
            target="_blank"
            to={`${current.pathname}/${participant.participantId}/ui`}
            onClick={() => navigate(`${participant.participantId}/reviewer-${getSequenceFlatMap(participant.sequence)[0]}`)}
          >
            {participant.participantId}
          </Anchor>
          <Text size="xl">{`${totalInteractions}`}</Text>
          <Text size="xl">{`${humanReadableDuration(duration)}`}</Text>
        </Group>
        {xScale ? <AllTasksTimeline xScale={xScale} setSelectedTask={() => null} participantData={participant} width={width} height={250} /> : null }
      </Stack>
    </Center>
  );
}
