import {
  IconSticker2,
} from '@tabler/icons-react';
import {
  Divider, Group, TextInput, ColorSwatch, useCombobox, Combobox, Pill, PillsInput, Input, Popover, Textarea,
} from '@mantine/core';
import * as d3 from 'd3';
import { useState } from 'react';
import { Tag } from '../types';
import { Pills } from './Pills';
import { TagSelector } from '../TextEditorComponents/TagSelector';

export function IconComponent({
  annotation, setAnnotation, start, current, end, text, tags, selectedTags, onTextChange, deleteRowCallback, addRowCallback, onSelectTags, addRef,
} : {annotation: string; setAnnotation: (s: string) => void; start: number, end: number, current: number, text: string, tags: Tag[], selectedTags: Tag[], onTextChange: (v: string) => void, deleteRowCallback: () => void, addRowCallback: (textIndex: number) => void, onSelectTags: (t: Tag[]) => void, addRef: (ref: HTMLTextAreaElement) => void }) {
  const [annotationVal, setAnnotationVal] = useState<string>(annotation);

  return (
    <Group justify="space-between" style={{ width: '100%' }} wrap="nowrap">
      <Group wrap="nowrap" gap={0} style={{ width: '100%', backgroundColor: current >= start && current <= end ? 'rgba(100, 149, 237, 0.3)' : 'white' }}>
        <Textarea
          ref={(r) => (r ? addRef(r) : null)}
          autosize
          minRows={1}
          maxRows={3}
          style={{ width: '100%' }}
          variant="unstyled"
          value={text}
          onChange={(e) => { onTextChange(e.currentTarget.value); }}
          onKeyDown={((e) => {
            if (e.key === 'Enter' && e.currentTarget.selectionStart !== null) {
              addRowCallback(e.currentTarget.selectionStart);
            } else if (e.key === 'Backspace') {
              if (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
                deleteRowCallback();
                e.preventDefault();
                e.stopPropagation();
              }
            }
          })}
        />
      </Group>
      <Group wrap="nowrap" style={{ width: '300px' }}>
        <Divider orientation="vertical" size="xs" />
        <TagSelector onSelectTags={onSelectTags} selectedTags={selectedTags} tags={tags} />
        <Popover>
          <Popover.Target>
            <IconSticker2 style={{ color: annotation.length > 0 ? 'cornflowerblue' : 'lightgray', cursor: 'pointer' }} />
          </Popover.Target>
          <Popover.Dropdown>
            <Textarea
              value={annotationVal}
              onChange={(event) => setAnnotationVal(event.currentTarget.value)}
              placeholder="Add Annotation"
              onBlur={() => setAnnotation(annotationVal)}
            />
          </Popover.Dropdown>

        </Popover>
      </Group>
    </Group>
  );
}
