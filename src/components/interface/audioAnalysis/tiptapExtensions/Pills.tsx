import {
  Pill,
} from '@mantine/core';
import * as d3 from 'd3';
import { Link } from 'react-router-dom';
import { Tag } from '../types';

export function Pills({
  selectedTags, removeFunc, isLink = false, participantId = '', currentTask = '',
} : {selectedTags: Tag[], removeFunc?: (s: string) => void, isLink?: boolean, participantId?: string, currentTask?: string}) {
  return selectedTags.map((tag, i) => {
    if (!tag || !tag.id) {
      return null;
    }
    const lightness = d3.hsl(tag.color!).l;

    return (
      <Pill
        component={isLink ? Link : null}
        // @ts-ignore
        to={`/ThinkAloud/analysis/${participantId}/ui/reviewer-${currentTask}`}
        target="_blank"
        key={tag.id + i}
        withRemoveButton={!!removeFunc}
        styles={{ root: { backgroundColor: tag.color, color: lightness > 0.7 ? 'black' : 'white' } }}
        onRemove={() => (removeFunc ? removeFunc(tag.id) : null)}
      >
        {tag.name}
      </Pill>
    );
  });
}
