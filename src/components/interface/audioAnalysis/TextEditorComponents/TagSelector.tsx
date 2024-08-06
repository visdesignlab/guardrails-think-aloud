/* eslint-disable no-nested-ternary */
import {
  Group, ColorSwatch, useCombobox, Combobox, Pill, PillsInput, Input,
} from '@mantine/core';
import { Tag } from '../types';
import { Pills } from '../tiptapExtensions/Pills';

export function TagSelector({
  tags, selectedTags, onSelectTags, disabled = false, taskTags, partTags,
} : {tags: Tag[], selectedTags: Tag[], onSelectTags: (t: Tag[]) => void, disabled?: boolean, taskTags?: Tag[], partTags?: Tag[]}) {
  const combobox = useCombobox();

  const handleValueSelect = (val: string) => onSelectTags([...selectedTags, [...tags, ...(taskTags || []), ...(partTags || [])].find((t) => t.id === val)!]);

  const handleValueRemove = (val: string) => onSelectTags(selectedTags.filter((t: Tag) => t !== undefined && t.id !== val));

  const values = <Pills selectedTags={selectedTags} removeFunc={handleValueRemove} />;

  const options = tags.filter((tag) => tag !== undefined && !selectedTags.find((selT) => selT && selT.id === tag.id)).map((tag) => (
    <Combobox.Option value={tag.id} key={tag.id}>
      <Group gap="sm">
        <ColorSwatch size={10} color={tag.color} />

        <span>{tag.name}</span>
      </Group>
    </Combobox.Option>
  ));

  const taskOptions = taskTags ? taskTags.filter((tag) => !selectedTags.find((selT) => selT.id === tag.id)).map((tag) => (
    <Combobox.Option value={tag.id} key={tag.id}>
      <Group gap="sm">
        <ColorSwatch size={10} color={tag.color} />

        <span>{tag.name}</span>
      </Group>
    </Combobox.Option>
  )) : null;

  const partOptions = partTags ? partTags.filter((tag) => !selectedTags.find((selT) => selT.id === tag.id)).map((tag) => (
    <Combobox.Option value={tag.id} key={tag.id}>
      <Group gap="sm">
        <ColorSwatch size={10} color={tag.color} />

        <span>{tag.name}</span>
      </Group>
    </Combobox.Option>
  )) : null;

  return (
    <Combobox disabled={disabled} width={300} store={combobox} onOptionSubmit={handleValueSelect} withinPortal>
      <Combobox.DropdownTarget>
        <PillsInput style={{ width: '400px' }} pointer onClick={() => combobox.toggleDropdown()}>
          <Pill.Group>
            {selectedTags.length > 0 ? (
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
          {options.length === 0 ? <Combobox.Empty>No additional tags</Combobox.Empty> : taskTags || partTags ? <Combobox.Group label="Text Tags">{options}</Combobox.Group> : options}
          {taskTags ? <Combobox.Group label="Task Tags">{taskOptions}</Combobox.Group> : null}
          {partTags ? <Combobox.Group label="Participant Tags">{partOptions}</Combobox.Group> : null}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>

  );
}
