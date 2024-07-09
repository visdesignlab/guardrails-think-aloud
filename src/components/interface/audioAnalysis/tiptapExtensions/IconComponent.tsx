import {
  IconSticker2,
} from '@tabler/icons-react';
import {
  Divider, Group, TextInput, ColorSwatch, useCombobox, Combobox, Pill, PillsInput, Input, Popover, Textarea,
} from '@mantine/core';
import * as d3 from 'd3';
import { useState } from 'react';
import { Tag } from '../types';

export function IconComponent({
  annotation, setAnnotation, start, current, end, text, tags, selectedTags, onTextChange, deleteRowCallback, addRowCallback, onSelectTags, addRef,
} : {annotation: string; setAnnotation: (s: string) => void; start: number, end: number, current: number, text: string, tags: Tag[], selectedTags: Tag[], onTextChange: (v: string) => void, deleteRowCallback: () => void, addRowCallback: (textIndex: number) => void, onSelectTags: (t: Tag[]) => void, addRef: (ref: HTMLInputElement) => void }) {
  const combobox = useCombobox();

  const [annotationVal, setAnnotationVal] = useState<string>(annotation);

  const handleValueSelect = (val: string) => onSelectTags([...selectedTags, tags.find((t) => t.id === val)!]);

  const handleValueRemove = (val: string) => onSelectTags(selectedTags.filter((t: Tag) => t.id !== val));

  const values = selectedTags.map((tag) => {
    const lightness = d3.hsl(tag.color!).l;

    return (
      <Pill key={tag.id} withRemoveButton styles={{ root: { backgroundColor: tag.color, color: lightness > 0.7 ? 'black' : 'white' } }} onRemove={() => handleValueRemove(tag.id)}>
        {tag.name}
      </Pill>
    );
  });

  const options = tags.filter((tag) => !selectedTags.find((selT) => selT.id === tag.id)).map((tag) => (
    <Combobox.Option value={tag.id} key={tag.id}>
      <Group gap="sm">
        <ColorSwatch size={10} color={tag.color} />

        <span>{tag.name}</span>
      </Group>
    </Combobox.Option>
  ));

  return (
    <Group justify="space-between" style={{ width: '100%' }} wrap="nowrap">
      <Group wrap="nowrap" gap={0} style={{ width: '100%', backgroundColor: current >= start && current <= end ? 'rgba(100, 149, 237, 0.3)' : 'white' }}>
        <TextInput
          ref={(r) => (r ? addRef(r) : null)}
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
        <Combobox width={300} store={combobox} onOptionSubmit={handleValueSelect} withinPortal={false}>
          <Combobox.DropdownTarget>
            <PillsInput style={{ width: '400px' }} pointer onClick={() => combobox.toggleDropdown()}>
              <Pill.Group>
                {values.length > 0 ? (
                  values
                ) : (
                  <Input.Placeholder>Add tags</Input.Placeholder>
                )}

                <Combobox.EventsTarget>
                  <PillsInput.Field
                    type="hidden"
                    onBlur={() => combobox.closeDropdown()}
                  />
                </Combobox.EventsTarget>
              </Pill.Group>
            </PillsInput>
          </Combobox.DropdownTarget>

          <Combobox.Dropdown>
            <Combobox.Options>
              {options.length === 0 ? <Combobox.Empty>No additional tags</Combobox.Empty> : options}
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
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
