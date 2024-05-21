import { IconMinusVertical, IconPlus } from '@tabler/icons-react';
import { NodeViewWrapper, NodeViewRendererProps, NodeViewContent } from '@tiptap/react';
import {
  ActionIcon,
  Button,
  ColorPicker,
  ColorSwatch,
  Divider, Group, MultiSelect, Stack, TextInput,
} from '@mantine/core';
import React, { useState } from 'react';
import { Tag } from '../types';

export function AddTagDropdown({ addTagCallback } : {addTagCallback : (tag: Tag) => void}) {
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>('cornflowerblue');

  return (
    <Stack spacing="xs">
      <Group>
        <ColorSwatch color={color} />
        <TextInput placeholder="Enter tag name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
      </Group>
      <ColorPicker style={{ width: '100%' }} value={color} onChange={(e) => setColor(e)} />
      <Button compact onClick={() => addTagCallback({ color, name })}>Add Tag</Button>
    </Stack>
  );
}
