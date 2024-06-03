import { IconMinusVertical, IconPlus } from '@tabler/icons-react';
import { NodeViewWrapper } from '@tiptap/react';
import {
  ActionIcon, Text, Divider, Group, MultiSelect, Popover, TextInput, ColorSwatch, MultiSelectValueProps, Box, CloseButton,
} from '@mantine/core';
import React, { forwardRef, useState } from 'react';
import * as d3 from 'd3';
import { AddTagDropdown } from './AddTagDropdown';
import { Tag } from '../types';

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  color: string,
  name: string,
  value: string,
  tags?: Tag[],
  addTag?: (t: Tag) => void,
}

// eslint-disable-next-line react/display-name
const SelectDropdown = forwardRef<HTMLDivElement, ItemProps>(
  ({
    color, name, ...others
  }: ItemProps, ref) => (
    <div
      ref={ref}
      {...others}
    >
      <Group spacing="xs" noWrap>
        <ColorSwatch size={10} color={color} />
        <Text>{name}</Text>
      </Group>
    </div>
  ),
);

function SelectValue({
  value,
  label,
  color,
  onRemove,
  classNames,
  ...others
}: MultiSelectValueProps & { value: string }) {
  const lightness = d3.hsl(color!).l;
  return (
    <div {...others}>
      <Box
        sx={(theme) => ({
          display: 'flex',
          cursor: 'default',
          alignItems: 'center',
          backgroundColor: color,
          border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[4]}`,
          paddingLeft: 4,
          borderRadius: 4,
        })}
      >
        <Text color={lightness > 0.7 ? 'dark' : 'white'} sx={{ lineHeight: 1, fontSize: 12 }}>{label}</Text>
        <CloseButton
          onMouseDown={onRemove}
          color={lightness > 0.7 ? 'dark' : 'white'}
          sx={{ color: lightness > 0.7 ? 'black' : 'white' }}
          variant="transparent"
          size={22}
          iconSize={14}
          tabIndex={-1}
        />
      </Box>
    </div>
  );
}

export function IconComponent({
  start, current, end, text, tags, selectedTags, addTag, onTextChange, deleteRowCallback, addRowCallback, onSelectTags, addRef,
} : {start: number, end: number, current: number, text: string, tags: Tag[], selectedTags: Tag[], addTag: (t: Tag) => void, onTextChange: (v: string) => void, deleteRowCallback: () => void, addRowCallback: (textIndex: number) => void, onSelectTags: (t: Tag[]) => void, addRef: (ref: HTMLInputElement) => void }) {
  return (
    <Group position="apart" style={{ width: '100%' }} noWrap>
      <Group noWrap spacing={0} style={{ width: '100%' }}>
        <IconMinusVertical height={40} width={20} viewBox="10 0 14 24" strokeWidth={2} color={current >= start && current <= end ? 'cornflowerblue' : 'lightgray'} />
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
      <Group noWrap style={{ width: '400px' }}>
        <Divider orientation="vertical" size="xs" />
        <MultiSelect
          nothingFound="No tags found. Add more via the + button."
          valueComponent={SelectValue}
          itemComponent={SelectDropdown}
          value={selectedTags.map((t) => t.name)}
          onChange={(t) => onSelectTags(t.map((name) => tags.find((allTag) => allTag.name === name)!))}
          style={{ width: '380px' }}
          data={tags.map((t) => ({ ...t, value: t.name, label: t.name }))}
        />
      </Group>
    </Group>
  );
}
