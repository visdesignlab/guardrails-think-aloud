/* eslint-disable no-nested-ternary */
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
import {
  IconArrowLeft, IconArrowRight, IconPlayerPause, IconPlayerPauseFilled, IconPlayerPlay,
  IconPlayerPlayFilled,
} from '@tabler/icons-react';
import debounce from 'lodash.debounce';
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
import { EditedText, ParticipantTags, TranscriptLinesWithTimes } from './types';
import { useStorageEngine } from '../../../storage/storageEngineHooks';
import { getSequenceFlatMap } from '../../../utils/getSequenceFlatMap';
import { useCurrentComponent } from '../../../routes/utils';
import { useAuth } from '../../../store/hooks/useAuth';
import { TagSelector } from './TextEditorComponents/TagSelector';

const margin = {
  left: 5, top: 0, right: 5, bottom: 0,
};

function getParticipantData(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
  if (storageEngine) {
    return storageEngine.getParticipantData(trrackId);
  }

  return null;
}

async function getTranscript(storageEngine: StorageEngine | undefined, partId: string | undefined, trialName: string | undefined, authEmail: string | null | undefined) {
  if (storageEngine && partId && trialName && authEmail) {
    return await storageEngine.getEditedTranscript(partId, authEmail, trialName);
  }

  return null;
}

async function getParticipantTags(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
  if (storageEngine && trrackId) {
    return (await storageEngine.getAllParticipantAndTaskTags());
  }

  return null;
}

async function getTags(storageEngine: StorageEngine | undefined, type: 'participant' | 'task' | 'text') {
  if (storageEngine) {
    return await storageEngine.getTags(type);
  }

  return [];
}
const prolificIds = ['61268bfae35dcb011f6081b5',
  '6659cba171cfa5c88e0f2f2d',
  '5bcbb1963c6f9f0001cc747a',
  '66af9c58a260607ed281b3d3',
  '606492360e422d12dc63000e',
  '66b20cecdaa58257b695232e',
  '637e31794e63dcbc52047f13',
  '5bfed68b7f1cfd0001d3a16b',
  '5f035c7ce9d86254e87992e4',
  '669aae6d0c2d9e337c393103',
  '66b0cee16f892ca232478aa9',
  '5b99663d4cefb60001e7a214',
  '65ccc7e766127e24c9e313a2',
  '62c8391cd913ab9b5317d5f9',
  '6658b23217b161dc426bd14d',
  '64135cd06bb7dc980f8cbd93',
  '6658d49af0f0787f8c8132b9',
  '5f653cb18aad310a9ee7c32d',
  '60fff225fb2da6129caf029a',
  '6690e84b526c802d080e8d7b'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AnalysisPopout({ mini } : {mini: boolean}) {
  const { trrackId, index } = useParams();

  const _trialFilter = useCurrentComponent();

  const auth = useAuth();

  const trialFilter = useMemo(() => (index ? _trialFilter : null), [_trialFilter, index]);

  const { storageEngine } = useStorageEngine();

  const [currentShownTranscription, setCurrentShownTranscription] = useState(0);

  const [ref, { width }] = useResizeObserver();

  const [currentNode, setCurrentNode] = useState<string | null>(null);

  const { value: participant, status } = useAsync(getParticipantData, [trrackId, storageEngine]);

  const { value: partTags, execute: pullPartTags } = useAsync(getParticipantTags, [trrackId, storageEngine]);

  const { saveAnalysisState } = useStoreActions();
  const storeDispatch = useStoreDispatch();

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playTime, setPlayTime] = useThrottledState<number>(0, 200);

  const waveSurferDiv = useRef(null);

  const config = useStudyConfig();

  const navigate = useNavigate();

  const { analysisTrialName: trialName, analysisWaveformTime } = useStoreSelector((state) => state);

  const { setAnalysisTrialName, setAnalysisParticipantName, setAnalysisWaveformTime } = useStoreActions();

  const { value: taskTags, execute: pullTaskTags } = useAsync(getTags, [storageEngine, 'task']);

  const [waveSurferLoading, setWaveSurferLoading] = useState<boolean>(true);

  const trrackForTrial = useRef<Trrack<object, string> | null>(null);

  const [transcriptLines, setTranscriptLines] = useState<TranscriptLinesWithTimes[]>([]);

  const [transcriptList, _setTranscriptList] = useState<EditedText[] | null>(null);

  const debouncedSave = useMemo(() => {
    if (storageEngine && trrackId && _trialFilter) {
      return debounce((editedText: EditedText[]) => storageEngine.saveEditedTranscript(trrackId, auth.user.user?.email || 'temp', _trialFilter, editedText), 1000, { maxWait: 5000 });
    }

    return (editedText: EditedText[]) => null;
  }, [_trialFilter, auth.user.user?.email, storageEngine, trrackId]);

  const setTranscriptList = useCallback((editedText: EditedText[]) => {
    _setTranscriptList(editedText);
    debouncedSave(editedText);
  }, [debouncedSave]);

  const { value: onlineTranscriptList, status: transcriptStatus } = useAsync(getTranscript, [storageEngine, participant?.participantId, _trialFilter, auth.user.user?.email]);

  const trialFilterAnswersName = useMemo(() => {
    if (!trialFilter || !participant) {
      return null;
    }

    return Object.keys(participant.answers).find((key) => key.startsWith(trialFilter)) || null;
  }, [participant, trialFilter]);

  useEffect(() => {
    if (onlineTranscriptList && transcriptStatus === 'success') {
      if (onlineTranscriptList.length === 0 && trialFilterAnswersName && participant && trialFilterAnswersName.split('-').length === 4 && participant.answers[trialFilterAnswersName] !== undefined) {
        const answer = participant.answers[trialFilterAnswersName].answer.explain as unknown as string;
        _setTranscriptList([{
          text: answer, transcriptMappingEnd: 0, transcriptMappingStart: 0, annotation: '', selectedTags: [],
        }]);
      } else {
        _setTranscriptList(onlineTranscriptList);
      }
    } else {
      _setTranscriptList(null);
    }
  }, [onlineTranscriptList, participant, transcriptStatus, trialFilterAnswersName]);

  const allPartIds = useMemo(() => [...prolificIds], []);

  // Create an instance of trrack to ensure getState works, incase the saved state is not a full state node.
  useEffect(() => {
    if (trialFilterAnswersName && participant) {
      const reg = Registry.create();

      const trrack = initializeTrrack({ registry: reg, initialState: {} });

      if (participant.answers[trialFilterAnswersName].provenanceGraph) {
        trrack.importObject(deepCopy(participant.answers[trialFilterAnswersName].provenanceGraph!));

        trrackForTrial.current = trrack;
      }
    }
  }, [participant, trialFilterAnswersName]);

  const _setCurrentNode = useCallback((node: string | undefined) => {
    if (!node) {
      return;
    }

    if (trialFilterAnswersName && participant && trrackForTrial.current) {
      storeDispatch(saveAnalysisState(trrackForTrial.current.getState(participant.answers[trialFilterAnswersName].provenanceGraph?.nodes[node])));

      trrackForTrial.current.to(node);
    }

    setCurrentNode(node);
  }, [participant, saveAnalysisState, storeDispatch, trialFilterAnswersName]);

  const setSelectedTask = useCallback((s: string) => {
    if (!mini) {
      storeDispatch(setAnalysisTrialName(s));
      storeDispatch(saveAnalysisState(null));
      setCurrentShownTranscription(0);

      const sFullName = participant ? Object.keys(participant.answers).find((key) => key.startsWith(s)) : '';

      if (participant && sFullName && participant.answers[sFullName].provenanceGraph) {
        const reg = Registry.create();

        const trrack = initializeTrrack({ registry: reg, initialState: {} });

        trrack.importObject(deepCopy(participant.answers[sFullName].provenanceGraph!));

        trrackForTrial.current = trrack;

        _setCurrentNode(participant.answers[sFullName].provenanceGraph?.root || '');
      } else {
        storeDispatch(saveAnalysisState(null));
        setCurrentNode(null);
        trrackForTrial.current = null;
      }
    }
  }, [_setCurrentNode, mini, participant, saveAnalysisState, setAnalysisTrialName, storeDispatch]);

  useEffect(() => {
    if (trialFilter) {
      setSelectedTask(trialFilter);
    }
  }, [setSelectedTask, trialFilter]);

  const timeUpdate = useEvent((t: number, dispatch = true) => {
    // check if were on the next task. If so, navigate to the next task
    if (participant && trialFilter && trialFilterAnswersName && (participant.answers[trialFilterAnswersName].endTime - participant.answers.audioTest_2.startTime) / 1000 < t) {
      const seq = getSequenceFlatMap(participant.sequence);
      setSelectedTask(seq[seq.indexOf(trialFilter) + 1]);
    } else if (participant && trialFilter && trrackForTrial.current && trrackForTrial.current.current.children.length > 0 && (trrackForTrial.current.graph.backend.nodes[trrackForTrial.current.current.children[0]].createdOn - participant.answers.audioTest_2.startTime) / 1000 < t) {
      _setCurrentNode(trrackForTrial.current.current.children[0]);
    }

    if (participant && trialFilter) {
      const startTime = (trialFilterAnswersName ? participant.answers[trialFilterAnswersName].startTime : participant.answers.audioTest_2.startTime);
      setPlayTime(t * 1000 + startTime);
    }

    if (dispatch) {
      storeDispatch(setAnalysisWaveformTime(t));
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
              .then((output) => waveSurfer.loadBlob(output.blob).then(() => { setWaveSurferLoading(false); }))
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

  const plugins = useMemo(() => [], []);

  const wavesurfer = useWavesurfer({
    container: waveSurferDiv.current!, plugins, onMount: handleWSMount, progressColor: 'cornflowerblue', waveColor: 'lightgray',
  } as any);

  const _setPlayTime = useCallback((n: number, percent: number) => {
    setPlayTime(n);

    if (wavesurfer && percent) {
      setTimeout(() => {
        wavesurfer.seekTo(percent);
      });
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

  useEffect(() => {
    timeUpdate(analysisWaveformTime, false);

    if (wavesurfer && Math.abs(wavesurfer.getCurrentTime() - analysisWaveformTime) > 0.8 && mini) {
      setTimeout(() => {
        wavesurfer.setTime(analysisWaveformTime);
      });
    }
  }, [analysisWaveformTime, mini, timeUpdate, wavesurfer]);

  const xScale = useMemo(() => {
    if (!participant) {
      return null;
    }

    const allStartTimes = Object.values(participant.answers || {}).map((answer) => [answer.startTime, answer.endTime]).flat();

    const extent = d3.extent(allStartTimes) as [number, number];

    const scale = d3.scaleLinear([margin.left, width + margin.left + margin.right]).domain(trialFilterAnswersName ? [participant.answers[trialFilterAnswersName].startTime, participant.answers[trialFilterAnswersName].endTime] : extent).clamp(true);

    return scale;
  }, [participant, trialFilterAnswersName, width]);

  useEffect(() => {
    handleWSMount(wavesurfer);
  }, [handleWSMount, participant, wavesurfer]);

  const clickNextNode = useCallback((node: string | undefined) => {
    if (!node) {
      return;
    }

    if (trialFilterAnswersName && participant && trrackForTrial.current && xScale) {
      const fullNode = participant.answers[trialFilterAnswersName].provenanceGraph!.nodes[node];
      storeDispatch(saveAnalysisState(trrackForTrial.current.getState(participant.answers[trialFilterAnswersName].provenanceGraph?.nodes[node])));

      trrackForTrial.current.to(node);

      const totalLength = xScale.domain()[1] - xScale.domain()[0];

      _setPlayTime(fullNode.createdOn + 1, (fullNode.createdOn - xScale.domain()[0]) / totalLength);
    }
  }, [_setPlayTime, participant, saveAnalysisState, storeDispatch, trialFilterAnswersName, xScale]);

  const nextParticipantCallback = useCallback((positive: boolean) => {
    if (!participant) {
      return;
    }

    const _index = allPartIds.indexOf(participant.participantId);

    if (positive) {
      navigate(`../../${trialFilter ? '../' : ''}${allPartIds[_index + 1]}/ui/reviewer-${trialFilter || ''}`, { relative: 'path' });
    } else {
      navigate(`../../${trialFilter ? '../' : ''}${allPartIds[_index - 1]}/ui/reviewer-${trialFilter || ''}`, { relative: 'path' });
    }
  }, [allPartIds, navigate, participant, trialFilter]);

  return (
    <Group wrap="nowrap" gap={25}>
      <Stack ref={ref} style={{ width: '100%' }} gap={!mini ? 25 : 0}>
        { !mini ? (
          <Center>
            <Group>
              <ActionIcon>
                <IconArrowLeft onClick={() => nextParticipantCallback(false)} />
              </ActionIcon>
              <Select
                style={{ width: '300px' }}
                value={participant?.participantId}
                onChange={(e) => {
                  storeDispatch(setAnalysisParticipantName(e));
                  navigate(`../../${trialFilter ? '../' : ''}${e}/ui/reviewer-${trialFilter || ''}`, { relative: 'path' });
                }}
                data={[...prolificIds]}
              />
              <Select
                style={{ width: '300px' }}
                clearable
                value={trialFilter}
                data={participant ? [...new Set([...getSequenceFlatMap(participant.sequence)])] : []}
                onChange={(val) => navigate(`${trialFilter ? '../' : ''}reviewer-${val || ''}`, { relative: 'path' })}
              />
              <ActionIcon>
                <IconArrowRight onClick={() => nextParticipantCallback(true)} />
              </ActionIcon>
            </Group>
          </Center>
        ) : null}
        {status === 'success' && participant && xScale
          ? !mini ? <AllTasksTimeline trialFilter={trialFilterAnswersName} xScale={xScale} setSelectedTask={setSelectedTask} participantData={participant} width={width} height={200} /> : null
          : !mini ? <Center style={{ height: '275px' }}><Loader /></Center>
            : null}
        { xScale && participant !== null && (trialFilterAnswersName ? participant.answers[trialFilterAnswersName] !== undefined : true)
          ? (
            <>
              <Box
                ref={waveSurferDiv}
                ml={participant && xScale ? xScale(participant.answers.audioTest_2.startTime) : 0}
                mr={participant && xScale ? xScale(participant.answers['post-study_19'].startTime) : 0}
                style={{
                  overflow: 'visible', width: `${participant && !trialFilter ? xScale(participant.answers['post-study_19'].startTime) - xScale(participant.answers.audioTest_2.startTime) : (xScale.range()[1] - xScale.range()[0])}px`,
                }}
              >
                <WaveSurferContext.Provider value={wavesurfer}>
                  <WaveForm id="waveform" />
                </WaveSurferContext.Provider>
                {waveSurferLoading ? <Loader /> : null}
              </Box>
              {!mini ? <TranscriptLines startTime={trialFilter ? xScale.domain()[0] : participant.answers.audioTest_2.startTime} xScale={xScale} transcriptLines={transcriptLines} currentShownTranscription={currentShownTranscription} /> : null }
            </>
          ) : null }
        {status === 'success' && participant && xScale ? <SingleTaskTimeline xScale={xScale} setSelectedTask={setSelectedTask} playTime={playTime - participant.answers.introduction_0.startTime} setPlayTime={_setPlayTime} isPlaying={isPlaying} setIsPlaying={_setIsPlaying} currentNode={currentNode} setCurrentNode={_setCurrentNode} participantData={participant} width={width} height={50} /> : null}
        <Group align="center" justify="center">
          {/* <ActionIcon variant="subtle"><IconArrowLeft onClick={() => clickNextNode((trrackForTrial.current?.current as any).parent)} /></ActionIcon> */}
          <ActionIcon variant="light" size={50} onClick={() => _setIsPlaying(!isPlaying)}>{isPlaying ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}</ActionIcon>
          {taskTags && partTags && trialFilter && trrackId ? (
            <TagSelector
              tags={taskTags || []}
              onSelectTags={(tempTag) => {
                if (storageEngine && partTags) {
                  const copy = deepCopy(partTags);
                  if (copy[trrackId as string]) {
                    copy[trrackId].taskTags[trialFilter] = tempTag;
                  } else {
                    copy[trrackId] = { partTags: [], taskTags: {} };

                    copy[trrackId].taskTags[trialFilter] = tempTag;
                  }

                  storageEngine.saveAllParticipantAndTaskTags(copy).then(() => {
                    pullPartTags(trrackId, storageEngine);
                  });
                }
              }}
              selectedTags={partTags && (partTags as Record<string, ParticipantTags>)[trrackId] ? (partTags as Record<string, ParticipantTags>)[trrackId].taskTags[trialFilter] || [] : []}
            />
          ) : null}
          {/* <Button onClick={() => _setIsPlaying(true)}>Play</Button>
          <Button onClick={() => _setIsPlaying(false)}>Pause</Button> */}
          {/* <ActionIcon variant="subtle"><IconArrowRight onClick={() => clickNextNode(trrackForTrial.current?.current.children[0])} /></ActionIcon> */}
        </Group>

        { trialFilter ? (
          <Stack>
            {participant && onlineTranscriptList && transcriptStatus === 'success' && transcriptList && !mini && (trialFilterAnswersName ? participant.answers[trialFilterAnswersName] !== undefined : true) ? <TextEditor transcriptList={transcriptList} setTranscriptList={setTranscriptList} setCurrentShownTranscription={setCurrentShownTranscription} currentShownTranscription={currentShownTranscription} participant={participant} playTime={playTime} setTranscriptLines={setTranscriptLines as any} /> : !mini ? <Loader /> : null}
          </Stack>
        ) : null}
      </Stack>
    </Group>
  );
}
