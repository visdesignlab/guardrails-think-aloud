import { IconLetterI, IconMinusVertical } from '@tabler/icons-react';
import { NodeViewWrapper, NodeViewRendererProps, NodeViewContent } from '@tiptap/react';
import { Group, Text } from '@mantine/core';
import React from 'react';

export function IconComponent(props: NodeViewRendererProps) {
  // console.log(props.node.attrs);
  return (
    <NodeViewWrapper as="span" className="react-icon" style={{ display: 'block' }}>
      <Group noWrap spacing={0}>
        {props.node.attrs.hasContent ? <IconMinusVertical height={40} width={20} viewBox="10 0 14 24" strokeWidth={2} color={props.node.attrs.current >= props.node.attrs.start && props.node.attrs.current <= props.node.attrs.end ? 'cornflowerblue' : 'lightgray'} /> : null}
        <NodeViewContent className="content" />
      </Group>
    </NodeViewWrapper>
  );
}
