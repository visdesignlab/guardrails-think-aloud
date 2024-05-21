import { IconMinusVertical, IconPlus } from '@tabler/icons-react';
import { NodeViewWrapper, NodeViewRendererProps, NodeViewContent } from '@tiptap/react';
import {
  ActionIcon,
  Divider, Group, MultiSelect, Popover,
} from '@mantine/core';
import React, { useState } from 'react';
import { AddTagDropdown } from './AddTagDropdown';

export function IconComponent(props: NodeViewRendererProps) {
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  // console.log(props.node.attrs);

  return (
    <NodeViewWrapper as="span" className="react-icon" style={{ display: 'block' }}>
      <Group position="apart" style={{ width: '100%' }}>
        <Group noWrap spacing={0}>
          {props.node.attrs.hasContent ? <IconMinusVertical height={40} width={20} viewBox="10 0 14 24" strokeWidth={2} color={props.node.attrs.current >= props.node.attrs.start && props.node.attrs.current <= props.node.attrs.end ? 'cornflowerblue' : 'lightgray'} /> : null}
          <NodeViewContent className="content" />
        </Group>
        <Group noWrap style={{ width: '200px' }}>
          <Divider orientation="vertical" size="xs" />
          <MultiSelect
            icon={(
              <Popover trapFocus opened={addDialogOpen} onChange={setAddDialogOpen} withinPortal>
                <Popover.Target>
                  <ActionIcon>
                    <IconPlus size="12" style={{ pointerEvents: 'auto' }} onClick={() => setAddDialogOpen(!addDialogOpen)} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <AddTagDropdown addTagCallback={() => null} />
                </Popover.Dropdown>
              </Popover>
            )}
            style={{ width: '180px' }}
            data={['Reading instructions', 'Insight v1', 'Insight v2']}
          />
        </Group>
      </Group>
    </NodeViewWrapper>
  );
}
