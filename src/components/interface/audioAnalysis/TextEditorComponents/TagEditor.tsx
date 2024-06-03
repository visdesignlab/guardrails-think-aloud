import {
  Text,
  ColorSwatch,
  Divider, Group, MultiSelect, Stack, TextInput, Button, Popover,
} from '@mantine/core';
import React, { useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import { Tag } from '../types';
import { AddTagDropdown } from '../tiptapExtensions/AddTagDropdown';

export function TagEditor({ createTagCallback, tags } : {createTagCallback : (tag: Tag) => void, tags: Tag[]}) {
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);

  return (
    <Stack style={{ width: '300px' }} spacing="xs">
      {tags.length === 0 ? <Text color="dimmed">No tags found. Create new tags below.</Text> : null}
      {tags.map((t) => (
        <Group position="apart" key={t.name}>
          <Group>
            <ColorSwatch color={t.color} />
            <Text>{t.name}</Text>
          </Group>
          <Popover trapFocus>
            <Popover.Target>
              <IconEdit color="lightgray" />
            </Popover.Target>
            <Popover.Dropdown>
              <AddTagDropdown editTag currentNames={tags.map((tag) => tag.name)} addTagCallback={(tag: Tag) => { createTagCallback(tag); }} />
            </Popover.Dropdown>
          </Popover>
        </Group>
      ))}

      <Popover trapFocus opened={addDialogOpen}>
        <Popover.Target>
          <Button variant="light" onClick={() => setAddDialogOpen(!addDialogOpen)}>
            Create new tag
          </Button>
        </Popover.Target>
        <Popover.Dropdown>
          <AddTagDropdown currentNames={tags.map((t) => t.name)} addTagCallback={(t: Tag) => { setAddDialogOpen(true); createTagCallback(t); }} />
        </Popover.Dropdown>
      </Popover>
    </Stack>
  );
}
