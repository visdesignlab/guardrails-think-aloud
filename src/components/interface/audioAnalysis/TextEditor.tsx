/* eslint-disable @typescript-eslint/no-explicit-any */
import * as TiptapHighlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import {
  useEffect, useRef, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { RichTextEditor } from '@mantine/tiptap';
import { Editor } from '@tiptap/core';
import { Transaction } from '@tiptap/pm/state';
import { ReplaceStep } from '@tiptap/pm/transform';
import { useEditor } from '@tiptap/react';
import { ParticipantData } from '../../../storage/types';
import { useStudyConfig } from '../../../store/hooks/useStudyConfig';
import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useEvent } from '../../../store/hooks/useEvent';

import ReactComponent from './tiptapExtensions/Extension';
import { TranscribedAudio } from './types';

interface EditedText {
  transcriptMappingStart: number;
  transcriptMappingEnd: number;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TextEditor({
  participant, playTime, setTranscriptLines, currentShownTranscription, setCurrentShownTranscription,
} : {participant: ParticipantData, playTime: number, setTranscriptLines: (lines: {start: number, end: number, lineStart: number, lineEnd: number}[]) => void; setCurrentShownTranscription: (i: number) => void; currentShownTranscription: number}) {
  const [transcription, setTranscription] = useState<TranscribedAudio | null>(null);

  const { trrackId, studyId, trialFilter } = useParams();

  const [editedList, setEditedList] = useState<EditedText[]>([]);

  const { storageEngine } = useStorageEngine();

  const config = useStudyConfig();

  const [textContent, setTextContent] = useState('<p></p>');

  const textChangeCallback = useEvent(({ editor: ed, transaction } : {editor: Editor, transaction: Transaction}) => {
    const lineCount = transaction.doc.childCount;

    const step = transaction.steps[0] as ReplaceStep;

    const newArr: string[] = [];
    transaction.doc.content.forEach((c) => newArr.push(c.textContent));

    // First, compare lines. If theyre the same, were going to assume for now a minor change occurred  (THIS IS NOT ALWAYS TRUE, CHEATING)
    if (lineCount === editedList.length) {
      setEditedList(editedList.map((item, i) => ({ ...item, text: newArr[i] })));
    } else if (step.from !== step.to) {
      // find first changed line. This line should be longer, and the next one shouldnt exist.
      const firstEditedIndex = editedList.findIndex((l, i) => l.text !== newArr[i]);

      const newEditedList = structuredClone(editedList);
      newEditedList[firstEditedIndex].text = newArr[firstEditedIndex];
      newEditedList[firstEditedIndex].transcriptMappingEnd = newEditedList[firstEditedIndex + 1].transcriptMappingEnd;

      newEditedList.splice(firstEditedIndex + 1, 1);

      newEditedList.filter((l) => l.transcriptMappingStart === newEditedList[firstEditedIndex].transcriptMappingStart).forEach((l) => { l.transcriptMappingEnd = newEditedList[firstEditedIndex].transcriptMappingEnd; });

      setEditedList(newEditedList);
    // ASSUMING WE JUST HIT ENTER, AND DID NOTHING ELSE. NOT SAFE.
    } else {
      // find first changed line. This line should be shorter, and we will assume the next one is new
      const firstEditedIndex = editedList.findIndex((l, i) => l.text !== newArr[i]);

      const newEditedList = structuredClone(editedList);
      newEditedList[firstEditedIndex].text = newArr[firstEditedIndex];

      const editedItem = newEditedList[firstEditedIndex];

      newEditedList.splice(firstEditedIndex + 1, 0, { transcriptMappingEnd: editedItem.transcriptMappingEnd, transcriptMappingStart: editedItem.transcriptMappingStart, text: newArr[firstEditedIndex + 1] });

      setEditedList(newEditedList);
    }
  });

  useEffect(() => {
    const lines: {start: number, end: number, lineStart: number, lineEnd: number}[] = [];

    editedList.forEach((l, i) => {
      if (transcription && (i === 0 || l.transcriptMappingStart !== editedList[i - 1].transcriptMappingStart)) {
        lines.push({
          start: i === 0 ? 0 : transcription.results[l.transcriptMappingStart - 1].resultEndTime as number, end: transcription.results[l.transcriptMappingEnd].resultEndTime as number, lineStart: l.transcriptMappingStart, lineEnd: l.transcriptMappingEnd,
        });
      }
    });

    setTranscriptLines(lines);
  }, [editedList, setTranscriptLines, transcription]);

  const cursor = useRef<number>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Superscript,
      SubScript,
      ReactComponent,
      // SpanParagraph,
      TiptapHighlight.Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    parseOptions: {
      preserveWhitespace: 'full',
    },
    content: textContent,
    editable: true,
    onUpdate: textChangeCallback,
    onSelectionUpdate: ({ editor: ed }) => {
      cursor.current = ed.state.selection.anchor;
    },
  }, []);

  useEffect(() => {
    if (editor) {
      editor
        .chain()
        .setContent(textContent, false, { preserveWhitespace: 'full' })
        .setTextSelection(cursor.current || 0)
        .run();
    }
  }, [textContent, editor]);

  useEffect(() => {
    if (editedList && editedList.length > 0) {
      setTextContent(editedList.map((s) => (`<react-component start='${s.transcriptMappingStart}' end='${s.transcriptMappingEnd}' current='${currentShownTranscription === null ? 0 : currentShownTranscription}'><p>${s.text}</p></react-component>`)).join(''));
    }
    // Want to not actually change this when text gets typed, because it causes problems in the editor. But this is also annoying when you jump to a next currentShown.
  }, [currentShownTranscription, editedList, transcription]);

  // Get transcription, and merge all of the transcriptions into one, correcting for time problems.
  useEffect(() => {
    if (studyId && trrackId && participant) {
      storageEngine?.getTranscription(participant.sequence.filter((seq) => config.tasksToNotRecordAudio === undefined || !config.tasksToNotRecordAudio.includes(seq)).filter((seq) => (trialFilter ? seq === trialFilter : true)), trrackId).then((data) => {
        const fullTranscription = data.map((d) => JSON.parse(d) as TranscribedAudio);
        let taskEndTime = 0;

        const newTranscription = fullTranscription.map((task) => {
          const newTimeTask = task.results.map((res) => ({ ...res, resultEndTime: +(res.resultEndTime as string).split('s')[0] + taskEndTime }));

          taskEndTime += +(task.results[task.results.length - 1].resultEndTime as string).split('s')[0];

          return newTimeTask;
        }).flat();

        setTranscription({ results: newTranscription });

        setEditedList(newTranscription.map((t, i) => ({ transcriptMappingStart: i, transcriptMappingEnd: i, text: t.alternatives[0].transcript?.trim() || '' })));
      });
    }
  }, [storageEngine, studyId, trrackId, config.tasksToNotRecordAudio, participant, trialFilter, setEditedList]);

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

  return textContent.length > 0 ? (
    <RichTextEditor
      editor={editor}
      styles={{
        content: {
          mark: {
            backgroundColor: 'transparent',
            color: 'cornflowerblue',
          },
        },
      }}
    >
      <RichTextEditor.Content />
    </RichTextEditor>
  ) : null;
}
