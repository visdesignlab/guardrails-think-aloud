/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect, useRef, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  Group, Popover, Stack, Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { ParticipantData } from '../../../storage/types';
import { useStudyConfig } from '../../../store/hooks/useStudyConfig';
import { useEvent } from '../../../store/hooks/useEvent';
import {
  EditedText, Tag, TranscribedAudio, TranscriptLinesWithTimes,
} from './types';
import { IconComponent } from './tiptapExtensions/IconComponent';
import { TagEditor } from './TextEditorComponents/TagEditor';
import { useStorageEngine } from '../../../storage/storageEngineHooks';
import { getSequenceFlatMap } from '../../../utils/getSequenceFlatMap';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TextEditor({
  participant, playTime, setTranscriptLines, currentShownTranscription, setCurrentShownTranscription, transcriptList, setTranscriptList,
} : {participant: ParticipantData, playTime: number, setTranscriptLines: (lines: TranscriptLinesWithTimes[]) => void; setCurrentShownTranscription: (i: number) => void; currentShownTranscription: number, transcriptList: EditedText[], setTranscriptList: (e: EditedText[]) => void}) {
  const [transcription, setTranscription] = useState<TranscribedAudio | null>(null);

  const { trrackId, studyId, trialFilter } = useParams();

  const [tags, setTags] = useState<Tag[]>([]);

  const { storageEngine } = useStorageEngine();

  const config = useStudyConfig();

  const textRefs = useRef<HTMLInputElement[]>([]);

  const textChangeCallback = useEvent((index: number, newVal: string) => {
    const tempList = [...transcriptList];
    tempList[index].text = newVal;

    setTranscriptList(tempList);
  });

  const addTagCallback = useEvent((index: number, newTags: Tag[]) => {
    const tempList = [...transcriptList];
    tempList[index].selectedTags = newTags;

    setTranscriptList(tempList);
  });

  // special logic for when I hit backspace at the start of one of the text boxes. Delete that row, move the text to the one above it, copy up the tags, accounting for duplicates
  const deleteRowCallback = useEvent((index) => {
    if (index === 0) {
      return;
    }

    const newEditedList = structuredClone(transcriptList);
    newEditedList[index - 1].text = transcriptList[index - 1].text + transcriptList[index].text;
    newEditedList[index - 1].transcriptMappingEnd = transcriptList[index].transcriptMappingEnd;
    newEditedList[index - 1].selectedTags = [...transcriptList[index - 1].selectedTags, ...transcriptList[index].selectedTags.filter((tag) => !transcriptList[index - 1].selectedTags.find((prevTags) => prevTags.name === tag.name))];

    newEditedList.splice(index, 1);

    newEditedList.filter((l) => l.transcriptMappingStart === newEditedList[index - 1].transcriptMappingStart).forEach((l) => { l.transcriptMappingEnd = newEditedList[index - 1].transcriptMappingEnd; });

    setTranscriptList(newEditedList);

    setTimeout(() => {
      textRefs.current[index - 1].focus();
      textRefs.current[index - 1].setSelectionRange(transcriptList[index - 1].text.length, transcriptList[index - 1].text.length, 'none');
    });
  });

  // Special logic for when i hit enter in any of the text boxes. Create a new row below, moving text after the enter into the new row, and copy the tags into the new row
  const addRowCallback = useEvent((index, textIndex) => {
    const newEditedList = structuredClone(transcriptList);
    const editedItem = newEditedList[index];

    newEditedList.splice(index + 1, 0, {
      transcriptMappingEnd: editedItem.transcriptMappingEnd, transcriptMappingStart: editedItem.transcriptMappingStart, text: editedItem.text.slice(textIndex), selectedTags: editedItem.selectedTags,
    });

    newEditedList[index].text = newEditedList[index].text.slice(0, textIndex);

    setTranscriptList(newEditedList);

    setTimeout(() => {
      textRefs.current[index + 1].focus();
      textRefs.current[index + 1].setSelectionRange(0, 0);
    });
  });

  // Create a separate object, transcriptLines, with additional time information so that I can create the actual lines under the waveform.
  useEffect(() => {
    const lines:TranscriptLinesWithTimes[] = [];

    transcriptList.forEach((l, i) => {
      if (transcription && (i === 0 || l.transcriptMappingStart !== transcriptList[i - 1].transcriptMappingStart)) {
        lines.push({
          start: i === 0 ? 0 : transcription.results[l.transcriptMappingStart - 1].resultEndTime as number,
          end: transcription.results[l.transcriptMappingEnd].resultEndTime as number,
          lineStart: l.transcriptMappingStart,
          lineEnd: l.transcriptMappingEnd,
          tags: transcriptList.filter((t) => t.transcriptMappingStart === l.transcriptMappingStart && t.transcriptMappingEnd === l.transcriptMappingEnd).map((t) => t.selectedTags),
        });
      }
    });

    setTranscriptLines(lines);
  }, [transcriptList, setTranscriptLines, transcription]);

  // Get transcription, and merge all of the transcriptions into one, correcting for time problems.
  useEffect(() => {
    if (studyId && trrackId && participant) {
      storageEngine?.getTranscription(getSequenceFlatMap(participant.sequence).filter((seq) => config.tasksToNotRecordAudio === undefined || !config.tasksToNotRecordAudio.includes(seq)).filter((seq) => (trialFilter ? seq === trialFilter : true)), trrackId).then((data) => {
        const fullTranscription = data.map((d) => JSON.parse(d) as TranscribedAudio);
        let taskEndTime = 0;

        const newTranscription = fullTranscription.map((task) => {
          const newTimeTask = task.results.map((res) => ({ ...res, resultEndTime: +(res.resultEndTime as string).split('s')[0] + taskEndTime }));

          taskEndTime += +(task.results[task.results.length - 1].resultEndTime as string).split('s')[0];

          return newTimeTask;
        }).flat();

        setTranscription({ results: newTranscription });

        setTranscriptList(newTranscription.map((t, i) => ({
          transcriptMappingStart: i, transcriptMappingEnd: i, text: t.alternatives[0].transcript?.trim() || '', selectedTags: [],
        })));

        setCurrentShownTranscription(0);
      });
    }
  }, [storageEngine, studyId, trrackId, config.tasksToNotRecordAudio, participant, trialFilter, setTranscriptList, setCurrentShownTranscription]);

  // Update the current transcription based on the playTime.
  // TODO:: this is super unperformant, but I don't have a solution atm. think about it harder
  useEffect(() => {
    if (transcription && currentShownTranscription !== null && participant && playTime > 0) {
      let tempCurrentShownTranscription = currentShownTranscription;
      const startTime = (trialFilter ? participant.answers[trialFilter].startTime : participant.answers.audioTest.startTime);

      const timeInSeconds = Math.abs(playTime - startTime) / 1000;

      if (timeInSeconds > (transcription.results[tempCurrentShownTranscription].resultEndTime as number)) {
        while (timeInSeconds > (transcription.results[tempCurrentShownTranscription].resultEndTime as number)) {
          tempCurrentShownTranscription += 1;

          if (tempCurrentShownTranscription > transcription.results.length - 1) {
            tempCurrentShownTranscription = transcription.results.length - 1;
            break;
          }
        }
      } else if (tempCurrentShownTranscription > 0 && timeInSeconds < (transcription.results[tempCurrentShownTranscription - 1].resultEndTime as number)) {
        while (tempCurrentShownTranscription > 0 && timeInSeconds < (transcription.results[tempCurrentShownTranscription - 1].resultEndTime as number)) {
          tempCurrentShownTranscription -= 1;
        }
      }

      if (currentShownTranscription === tempCurrentShownTranscription) return;

      setCurrentShownTranscription(tempCurrentShownTranscription);
    }
  }, [currentShownTranscription, participant, playTime, setCurrentShownTranscription, transcription, trialFilter]);

  return (
    <Stack spacing={0}>
      <Group mb="xl" position="apart" noWrap>
        <Text style={{ flexGrow: 1, textAlign: 'center' }}>Transcript</Text>
        <Popover>
          <Popover.Target>
            <Group position="center" style={{ width: '380px', cursor: 'pointer' }}>
              <IconPlus />
              <Text>Tags</Text>

            </Group>
          </Popover.Target>
          <Popover.Dropdown>
            <TagEditor createTagCallback={(t: Tag) => { setTags([...tags, t]); }} tags={tags} />
          </Popover.Dropdown>
        </Popover>
      </Group>
      {transcriptList.map((line, i) => (
        <IconComponent
          addRef={(ref) => { textRefs.current[i] = ref; }}
          onSelectTags={(newTags: Tag[]) => addTagCallback(i, newTags)}
          addRowCallback={(textIndex) => addRowCallback(i, textIndex)}
          deleteRowCallback={() => deleteRowCallback(i)}
          onTextChange={((val) => textChangeCallback(i, val))}
          tags={tags}
          selectedTags={line.selectedTags}
          addTag={(t: Tag) => { setTags([...tags, t]); addTagCallback(i, [...line.selectedTags, t]); }}
          text={line.text}
          key={i}
          start={line.transcriptMappingStart}
          end={line.transcriptMappingEnd}
          current={currentShownTranscription === null ? 0 : currentShownTranscription}
        />
      ))}
    </Stack>
  );
}
