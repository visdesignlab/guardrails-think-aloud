import {
  MantineSize,
  Pill,
  Tooltip,
} from '@mantine/core';
import * as d3 from 'd3';
import { Link } from 'react-router-dom';
import { Tag } from '../types';
import { PREFIX } from '../../../../utils/Prefix';

export function Pills({
  selectedTags, removeFunc, isLink = false, participantId = '', currentTask = '', size = 'md',
} : {selectedTags: Tag[], removeFunc?: (s: string) => void, isLink?: boolean, participantId?: string, currentTask?: string, size?: MantineSize}) {
  return selectedTags.map((tag, i) => {
    if (!tag || !tag.id) {
      return null;
    }
    const lightness = d3.hsl(tag.color!).l;

    return (
      <Tooltip key={participantId + currentTask + i} label={tag.name} withinPortal>
        <Pill
          size={size}
          component={isLink ? Link : null}
          style={{ width: '80px' }}
        // @ts-ignore
          to={`${PREFIX}ThinkAloud/analysis/${participantId}/ui/reviewer-${currentTask}`}
          target="_blank"
          key={tag.id + i}
          withRemoveButton={!!removeFunc}
          styles={{ root: { backgroundColor: tag.color, color: lightness > 0.7 ? 'black' : 'white' } }}
          onRemove={() => (removeFunc ? removeFunc(tag.id) : null)}
        >
          {tag.name}
        </Pill>
      </Tooltip>
    );
  });
}
