import {
  Text,
  ColorSwatch,
  Divider, Group, MultiSelect, Stack, TextInput, Button, Popover,
  Loader,
} from '@mantine/core';
import React, { useState } from 'react';
import { IconEdit, IconPlus } from '@tabler/icons-react';
import { Tag } from '../types';
import { AddTagDropdown } from '../tiptapExtensions/AddTagDropdown';

export function TagEditor({
  createTagCallback, editTagCallback, tags, email = '',
} : {createTagCallback : (tag: Tag) => void, editTagCallback: (oldTag: Tag, newTag: Tag) => void, tags: Tag[], email?: string}) {
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);

  return (
    <Popover withinPortal={false}>
      <Popover.Target>
        <Stack justify="center" style={{ width: '300px', cursor: 'pointer' }}>
          <Group>
            <IconPlus />
            <Text>Tags</Text>
          </Group>
          {email ? <Text ta="center" style={{ justifyContent: 'end', alignContent: 'end' }} c="dimmed">{email}</Text> : null }
        </Stack>
      </Popover.Target>
      {tags
        ? (
          <Popover.Dropdown>
            <Stack style={{ width: '300px' }} gap="xs">
              {tags.length === 0 ? <Text color="dimmed">No tags found. Create new tags below.</Text> : null}
              {tags.map((t) => (
                <Group justify="space-between" key={t.id}>
                  <Group>
                    <ColorSwatch color={t.color} />
                    <Text>{t.name}</Text>
                  </Group>
                  <Popover trapFocus withinPortal={false}>
                    <Popover.Target>
                      <IconEdit color="lightgray" />
                    </Popover.Target>
                    <Popover.Dropdown>
                      <AddTagDropdown editTag currentNames={tags.map((tag) => tag.name)} addTagCallback={(tag: Tag) => { editTagCallback(t, { ...tag, id: t.id }); }} editableTag={t} />
                    </Popover.Dropdown>
                  </Popover>
                </Group>
              ))}

              <Popover trapFocus opened={addDialogOpen} withinPortal={false}>
                <Popover.Target>
                  <Button variant="light" onClick={() => setAddDialogOpen(!addDialogOpen)}>
                    Create new tag
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <AddTagDropdown currentNames={tags.map((t) => t.name)} addTagCallback={(t: Tag) => { setAddDialogOpen(false); createTagCallback(t); }} />
                </Popover.Dropdown>
              </Popover>
            </Stack>
          </Popover.Dropdown>
        ) : <Loader />}
    </Popover>

  );
}
