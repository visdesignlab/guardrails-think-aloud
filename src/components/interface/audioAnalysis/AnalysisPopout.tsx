/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionIcon,
  Box, Button, Center, Group, Loader, Select, Stack, Text,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useResizeObserver, useThrottledState } from '@mantine/hooks';
import { WaveForm, useWavesurfer } from 'wavesurfer-react';
import WaveSurferContext from 'wavesurfer-react/dist/contexts/WaveSurferContext';
import Crunker from 'crunker';
import * as d3 from 'd3';
import { Registry, Trrack, initializeTrrack } from '@trrack/core';
import WaveSurfer from 'wavesurfer.js';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';
import { AllTasksTimeline } from './AllTasksTimeline';
import { SingleTaskTimeline } from './SingleTaskTimeline';
import { useStudyConfig } from '../../../store/hooks/useStudyConfig';
import { deepCopy } from '../../../utils/deepCopy';
import { useEvent } from '../../../store/hooks/useEvent';
import { useStoreActions, useStoreDispatch, useStoreSelector } from '../../../store/store';
import { TranscriptLines } from './TransciptLines';
import { TextEditor } from './TextEditor';
import { EditedText, TranscriptLinesWithTimes } from './types';
import { useStorageEngine } from '../../../storage/storageEngineHooks';
import { getSequenceFlatMap } from '../../../utils/getSequenceFlatMap';

const margin = {
  left: 5, top: 0, right: 5, bottom: 0,
};

function getParticipantData(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
  if (storageEngine) {
    return storageEngine.getParticipantData(trrackId);
  }

  return null;
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
  '605e622287f0e806ffe04590'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisPopout() {
  const { trrackId, trialFilter } = useParams();

  const { storageEngine } = useStorageEngine();

  const [currentShownTranscription, setCurrentShownTranscription] = useState(0);

  const [ref, { width }] = useResizeObserver();

  const [currentNode, setCurrentNode] = useState<string | null>(null);

  const { value: participant, status } = useAsync(getParticipantData, [trrackId, storageEngine]);

  const { saveAnalysisState } = useStoreActions();
  const storeDispatch = useStoreDispatch();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playTime, setPlayTime] = useThrottledState<number>(0, 50);

  const waveSurferDiv = useRef(null);

  const config = useStudyConfig();

  const navigate = useNavigate();

  const { analysisTrialName: trialName } = useStoreSelector((state) => state);

  const { setAnalysisTrialName } = useStoreActions();

  const [waveSurferLoading, setWaveSurferLoading] = useState<boolean>(true);

  const trrackForTrial = useRef<Trrack<object, string> | null>(null);

  const [transcriptLines, setTranscriptLines] = useState<TranscriptLinesWithTimes[]>([]);

  const [transcriptList, setTranscriptList] = useState<EditedText[]>([]);

  const allPartIds = useMemo(() => [...inPersonIds, ...prolificIds], []);
  // Create an instance of trrack to ensure getState works, incase the saved state is not a full state node.
  useEffect(() => {
    if (trialName && participant) {
      const reg = Registry.create();

      const trrack = initializeTrrack({ registry: reg, initialState: {} });

      if (participant.answers[trialName].provenanceGraph) {
        trrack.importObject(deepCopy(participant.answers[trialName].provenanceGraph!));

        trrackForTrial.current = trrack;
      }
    }
  }, [participant, trialName]);

  const _setCurrentNode = useCallback((node: string) => {
    // if (trialName && participant && trrackForTrial) {
    //   setProvState(trrackForTrial.getState(participant.answers[trialName].provenanceGraph?.nodes[node]));

    //   trrackForTrial.to(node);
    // }

    if (trialName && participant && trrackForTrial.current) {
      // setProvState(trrackForTrial.getState(participant.answers[trialName].provenanceGraph?.nodes[currentNode]));
      storeDispatch(saveAnalysisState(trrackForTrial.current.getState(participant.answers[trialName].provenanceGraph?.nodes[node])));

      trrackForTrial.current.to(node);
    }

    setCurrentNode(node);
  }, [participant, saveAnalysisState, storeDispatch, trialName, trrackForTrial]);

  const setSelectedTask = useCallback((s: string) => {
    if (s !== trialName) {
      storeDispatch(setAnalysisTrialName(s));
      storeDispatch(saveAnalysisState(null));

      if (participant && participant.answers[s].provenanceGraph) {
        const reg = Registry.create();

        const trrack = initializeTrrack({ registry: reg, initialState: {} });

        trrack.importObject(deepCopy(participant.answers[s].provenanceGraph!));

        trrackForTrial.current = trrack;

        _setCurrentNode(participant.answers[s].provenanceGraph?.root || '');
      } else {
        storeDispatch(saveAnalysisState(null));
        setCurrentNode(null);
        trrackForTrial.current = null;
      }
    }
  }, [_setCurrentNode, participant, saveAnalysisState, setAnalysisTrialName, storeDispatch, trialName]);

  useEffect(() => {
    if (trialFilter) {
      setSelectedTask(trialFilter);
    }
  }, [setSelectedTask, trialFilter]);

  const timeUpdate = useEvent((t: number) => {
    // check if were on the next task. If so, navigate to the next task
    if (participant && trialName && (participant.answers[trialName].endTime - participant.answers.audioTest.startTime) / 1000 < t) {
      const seq = getSequenceFlatMap(participant.sequence);
      setSelectedTask(seq[seq.indexOf(trialName) + 1]);
    } else if (participant && trialName && trrackForTrial.current && trrackForTrial.current.current.children.length > 0 && (trrackForTrial.current.graph.backend.nodes[trrackForTrial.current.current.children[0]].createdOn - participant.answers.audioTest.startTime) / 1000 < t) {
      _setCurrentNode(trrackForTrial.current.current.children[0]);
    }

    if (participant && trialName) {
      const startTime = (trialFilter ? participant.answers[trialFilter].startTime : participant.answers.audioTest.startTime);
      setPlayTime(t * 1000 + startTime);
    }
  });

  const handleWSMount = useCallback(
    (waveSurfer: WaveSurfer | null) => {
      if (waveSurfer && participant && trrackId) {
        const crunker = new Crunker();

        storageEngine?.getAudio(getSequenceFlatMap(participant.sequence).filter((seq) => config.tasksToNotRecordAudio === undefined || !config.tasksToNotRecordAudio.includes(seq)).filter((seq) => (trialFilter ? seq === trialFilter : true)), trrackId).then((urls) => {
          if (waveSurfer) {
            crunker
              .fetchAudio(...urls)
              .then((buffers) => crunker.concatAudio(buffers))
              .then((merged) => crunker.export(merged, 'audio/mp3'))
              .then((output) => waveSurfer.loadBlob(output.blob).then(() => setWaveSurferLoading(false)))
              .catch((error) => {
                throw new Error(error);
              });
          }

          waveSurfer.on('timeupdate', timeUpdate);
        });
      }
    },
    [config.tasksToNotRecordAudio, participant, storageEngine, timeUpdate, trialFilter, trrackId],
  );

  const wavesurfer = useWavesurfer({ container: waveSurferDiv.current!, plugins: [], onMount: handleWSMount });

  useEffect(() => {
    handleWSMount(wavesurfer);
  }, [handleWSMount, participant, wavesurfer]);

  const _setPlayTime = useCallback((n: number, percent: number) => {
    setPlayTime(n);

    if (wavesurfer && percent) {
      wavesurfer?.seekTo(percent);
    }
  }, [setPlayTime, wavesurfer]);

  const _setIsPlaying = useCallback((b: boolean) => {
    setIsPlaying(b);

    if (wavesurfer) {
      if (b) {
        wavesurfer.play();
      } else {
        wavesurfer.pause();
      }
    }
  }, [wavesurfer]);

  const xScale = useMemo(() => {
    if (!participant) {
      return null;
    }

    const allStartTimes = Object.values(participant.answers || {}).map((answer) => [answer.startTime, answer.endTime]).flat();

    const extent = d3.extent(allStartTimes) as [number, number];

    const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(trialFilter ? [participant.answers[trialFilter].startTime, participant.answers[trialFilter].endTime] : extent).clamp(true);

    return scale;
  }, [participant, trialFilter, width]);

  const nextParticipantCallback = useCallback((positive: boolean) => {
    if (!participant) {
      return;
    }

    const index = allPartIds.indexOf(participant.participantId);

    if (positive) {
      navigate(`../../${trialFilter ? '../' : ''}${allPartIds[index + 1]}/ui/${trialFilter || ''}`, { relative: 'path' });
    } else {
      navigate(`../../${trialFilter ? '../' : ''}${allPartIds[index - 1]}/ui/${trialFilter || ''}`, { relative: 'path' });
    }
  }, [allPartIds, navigate, participant, trialFilter]);

  return (
    <Group wrap="nowrap" gap={25}>
      <Stack ref={ref} style={{ width: '100%' }} gap={25}>
        <Center>
          <Group>
            <ActionIcon>
              <IconArrowLeft onClick={() => nextParticipantCallback(false)} />
            </ActionIcon>
            <Select
              style={{ width: '300px' }}
              value={participant?.participantId}
              onChange={(e) => navigate(`../../${trialFilter ? '../' : ''}${e}/ui/${trialFilter || ''}`, { relative: 'path' })}
              data={[...inPersonIds, ...prolificIds]}
            />
            <Select
              style={{ width: '300px' }}
              clearable
              value={trialFilter}
              data={participant ? [...getSequenceFlatMap(participant.sequence)] : []}
              onChange={(val) => navigate(`${trialFilter ? '../' : ''}${val || ''}`, { relative: 'path' })}
            />
            <ActionIcon>
              <IconArrowRight onClick={() => nextParticipantCallback(true)} />
            </ActionIcon>
          </Group>
        </Center>
        {status === 'success' && participant && xScale ? <AllTasksTimeline trialFilter={trialFilter} xScale={xScale} setSelectedTask={setSelectedTask} participantData={participant} width={width} height={200} /> : <Center style={{ height: '275px' }}><Loader /></Center>}
        { xScale && participant !== null
          ? (
            <>
              <Box
                ref={waveSurferDiv}
                ml={participant && xScale ? xScale(participant.answers.audioTest_2.startTime) : 0}
                mr={participant && xScale ? xScale(participant.answers['post-study-survey_13'].startTime) : 0}
                style={{
                  WebkitBoxSizing: 'border-box', width: `${participant && xScale ? xScale(participant.answers['post-study-survey_13'].startTime) - xScale(participant.answers.audioTest_2.startTime) : 0}px`,
                }}
              >
                <WaveSurferContext.Provider value={wavesurfer} key={participant.participantId}>
                  <WaveForm id="waveform" />
                </WaveSurferContext.Provider>
                {waveSurferLoading ? <Loader /> : null}
              </Box>
              <TranscriptLines startTime={trialFilter ? xScale.domain()[0] : participant.answers.audioTest_2.startTime} xScale={xScale} transcriptLines={transcriptLines} currentShownTranscription={currentShownTranscription} />
            </>
          ) : null }
        {status === 'success' && participant && xScale ? <SingleTaskTimeline xScale={xScale} setSelectedTask={setSelectedTask} playTime={playTime - participant.answers.introduction_0.startTime} setPlayTime={_setPlayTime} isPlaying={isPlaying} setIsPlaying={_setIsPlaying} currentNode={currentNode} setCurrentNode={_setCurrentNode} participantData={participant} width={width} height={50} /> : null}

        {/* <Group style={{ width: '100%', height: '100px' }} align="center" position="center">
          <Center>
            <Text color="dimmed" size={20} style={{ width: '100%' }} />
          </Center>
        </Group> */}
        <Group>
          <Button onClick={() => _setIsPlaying(true)}>Play</Button>
          <Button onClick={() => _setIsPlaying(false)}>Pause</Button>
          <Text>{new Date(playTime).toLocaleString()}</Text>
        </Group>

        <Stack>
          {participant ? <TextEditor transcriptList={transcriptList} setTranscriptList={setTranscriptList} setCurrentShownTranscription={setCurrentShownTranscription} currentShownTranscription={currentShownTranscription} participant={participant} playTime={playTime} setTranscriptLines={setTranscriptLines as any} /> : null}
        </Stack>
      </Stack>
    </Group>
  );
}
