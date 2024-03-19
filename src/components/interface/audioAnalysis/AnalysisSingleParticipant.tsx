/* eslint-disable @typescript-eslint/no-explicit-any */

import { useNavigate } from 'react-router-dom';

import {
  Anchor, Center, Group, Stack, Text,
} from '@mantine/core';
import { useMemo } from 'react';
import { useResizeObserver } from '@mantine/hooks';
import * as d3 from 'd3';
import { AllTasksTimeline } from './AllTasksTimeline';
import { ParticipantData } from '../../../storage/types';

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

const inPersonIds = ['participant1',
  'participant2',
  'participant3',
  'participant4',
  'participant5',
  'participant6',
  'participant7',
  'participant8',
  'participant9',
  'participant10',
  'participant11'];

const prolificIds = ['64889a71fa7592ae332fa34f',
  '63626a68cf44b4184483c8e8',
  '5c838a63532afd001506fd34',
  '6171849094893d838e6e6f62',
  '5b14898a30d562000155f1e9',
  '5ba42e35984ec30001c6018d',
  '5e690f83d1e0d41a69f00db8',
  '65c10e659858a125507f47f7',
  '616c844bac81732b87340f97',
  '63f7a3b799889de3f13622db',
  '65a4333efc75f965e7fc0cb5',
  '65dca61cadaa2dd820a0f28c',
  '65a00ba072965b5ce928d307',
  '5cb3cdc781f3750001043bf2',
  '5d76ac914c93440001c03fd7',
  '65c691b5ca603ec8e389700e',
  '5d31dc6e42678e001a0bdedd',
  '6294ce94ea81c4554b141010',
  '60743e408fd768b1a939ed4c',
  '638a8c63c74f91261108cebf',
  '5780d9a1900cc80001d2d1c2',
  '5fa07c635b16f50d21483d5e',
  '63ee65e3470c23cb401ca89a',
  '5b99663d4cefb60001e7a214',
  '63162bda14b96736b08a554d',
  '6554e79557e3d6be08e32ceb',
  '63d5021468a31efc02740c1e',
  '63fbf0e3b18cc14adc0dbfb6',
  '63beebaa4c5884797ff00a98',
  '64217d8202361ad4dbed3596',
  '58ff31a1d10e2b000108579e',
  '63f779d27ba18edb4b6e5a57',
  '62e023ae6d022e4d7bfc5db1',
  '5e5521580ee1b951df544c3c',
  '5bb756696322c5000159756c',
  '637545d6428d85daeedc3df5',
  '641ecfa9f83175a3d9f63636',
  '611a8d23c1d17506a23df589',
  '605e622287f0e806ffe04590',
  '5f21224ca1a41d48cd4fc726',
  '5841a2d39d65770001cebfa1',
  '65aed5e598b1181bdb57f06a',
  '62cfee5a0c2e87501bfb10bc',
  '5e8381eccec7700be5fda040',
  '5eabf74457f54b1ec1692eeb',
  '59f0be850fb3a90001bd9fc8',
  '5f0cfeef098f1e53ff201909',
  '61096a6ab244ccee2220a180',
  '56abcb46f209e0000adab961',
  '5929c96027ea400001301061',
  '614cd4d65c8c90077afbe40f',
  '643c23204a1aa8edc3772c85',
  '65577b529ee538baa6f0093a',
  '65980bc29762c803add36c45',
  '6385fd4f0e0133c619851b7e',
  '65845f67f9ed8c08c8e58949',
  '62cebb481d8dff18f66ef320',
  '614dbfd84002a61c075c791c',
  '5b82d4fda284bc000193094c',
  '657421f9661ce9a8cd7482d1',
  '5f9802a1306ea3045e8c0b43',
  '56a8bccb7f24720006942472',
  '611e8bbe52b050f81208f7ea',
  '5ddac93016d10ca2991f7dbf',
  '55120a31fdf99b1b938c22fb',
  '65cbc91873b2f925cbe817d7',
  '5bead56b5324b10001c2551c',
  '609d1ddf6aa3ba55f1bf4267',
  '58bfee7de5869400018f5e9e',
  '65d7be48839848c074cdf948',
  '5c67e30581ea8900018ae0d0',
  '5a062680c259f300017656b3',
  '5cf12b12fe14310001ce0928',
  '62c5ebe612c40c7e32390bf6',
  '5dc018fc2e1bfa4504eb4ce5',
  '6413603a62c72120012e05be',
  '5c8ba607c5366c0001d022cb',
  '63654d0e99f5b917e61dffac',
  '62a1e2fd89e02622395cab4d',
  '616cbfb55486b52d735885fa',
  '611c0f606e7c5373600b2943',
  '63e5a6690eeedc20da056717',
  '6140f89d1e3eb6c838729c12',
  '63e68535d78fc9bb61c3c6b4',
  '5df416a57bf5722f9a501255',
  '5f91bfea8dd0a10787eb412b',
  '5a9bbda1f6dfdd0001ea9639',
  '5b4d41e13d01bd0001ec46c2',
  '5ee4a14b578f8a000b384376'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisSingleParticipant({ participant, maxDuration } : {participant: ParticipantData, maxDuration?: number | undefined}) {
  const navigate = useNavigate();

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

  return (
    <Center>
      <Stack spacing={25} ref={ref} style={{ width: '75%' }} key={participant.participantId}>
        <Group position="apart">
          <Anchor size={25} onClick={() => navigate(`${participant.participantId}/${participant.sequence[0]}`)}>{participant.participantId}</Anchor>
          {' '}
          <Text size="xl">{`${totalInteractions}`}</Text>

          <Text size="xl">{`${humanReadableDuration(duration)}`}</Text>
          {' '}
        </Group>
        <AllTasksTimeline selectedTask={null} setSelectedTask={() => null} participantData={participant} width={width} height={250} />
      </Stack>
    </Center>
  );
}
