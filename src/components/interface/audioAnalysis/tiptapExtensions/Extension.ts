import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import Paragraph from '@tiptap/extension-paragraph';
import { IconComponent } from './IconComponent';

export default Node.create({
  name: 'reactComponent',

  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      current: {
        default: false,
      },
      start: {
        default: 0,
      },
      end: {
        default: 0,
      },
      hasContent: {
        default: true,
      },

    };
  },

  parseHTML() {
    return [
      {
        tag: 'react-component',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['react-component', mergeAttributes({ display: 'block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IconComponent, { as: 'span', className: 'test', attrs: { style: 'display: block' } });
  },
});
