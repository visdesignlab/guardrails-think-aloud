import {
  Badge, Box, NavLink, Popover, Text,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconArrowsShuffle, IconBrain } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { ComponentBlock } from '../../parser/types';
import { Sequence } from '../../store/types';
import { deepCopy } from '../../utils/deepCopy';
import { useCurrentStep, useStudyId } from '../../routes/utils';
import { getSequenceFlatMap } from '../../utils/getSequenceFlatMap';
import { useStudyConfig } from '../../store/hooks/useStudyConfig';

export type ComponentBlockWithOrderPath = Omit<ComponentBlock, 'components'> & { orderPath: string; components: (ComponentBlockWithOrderPath | string)[]};

function findTaskIndexInSequence(sequence: Sequence, step: string, startIndex: number, requestedPath: string): number {
  let index = 0;

  // Loop through the sequence components and find the index of the task if it's in this block
  for (let i = 0; i < sequence.components.length; i += 1) {
    const component = sequence.components[i];
    if (typeof component === 'string') {
      if (requestedPath === sequence.orderPath && component === step && i >= startIndex) {
        break;
      }
      index += 1;
    } else {
      // See if the task is in the nested sequence
      index += findTaskIndexInSequence(component, step, startIndex, requestedPath);

      // If the task is in the nested sequence, break the loop. We need includes, because we need to break the loop if the task is in the nested sequence
      if (requestedPath.includes(component.orderPath)) {
        break;
      }
    }
  }

  return index;
}

function countInterruptionsRecursively(configSequence: ComponentBlockWithOrderPath, participantSequence: Sequence) {
  let count = 0;

  // Loop through the participant sequence and count the interruptions that are defined in the configSequence
  participantSequence.components.forEach((component) => {
    if (typeof component === 'string' && configSequence.interruptions?.flatMap((i) => i.components).includes(component)) {
      count += 1;
    } else if (typeof component !== 'string') {
      // If the component is a sequence, find the corresponding sequence in the configSequence and count the interruptions
      const configSubSequence = configSequence.components.find((c) => typeof c !== 'string' && c.orderPath === component.orderPath) as ComponentBlockWithOrderPath;
      count += countInterruptionsRecursively(configSubSequence, component);
    }
  });

  return count;
}

function reorderComponents(configSequence: ComponentBlockWithOrderPath['components'], participantSequence: Sequence['components']) {
  const newComponents: (string | ComponentBlockWithOrderPath)[] = [];

  // Iterate through the sequence components and reorder the orderComponents
  participantSequence.forEach((sequenceComponent) => {
    // Find the index of the sequenceComponent in the configSequence
    const configSequenceIndex = configSequence.findIndex((c) => {
      if (typeof c === 'string') {
        return c === sequenceComponent;
      }
      return typeof sequenceComponent !== 'string' && c.orderPath === sequenceComponent.orderPath;
    });

    if (configSequenceIndex !== -1) {
      newComponents.push(configSequence[configSequenceIndex]);
      configSequence.splice(configSequenceIndex, 1);
    }

    if (configSequenceIndex === -1 && typeof sequenceComponent === 'string') {
      newComponents.push(sequenceComponent);
    }
  });

  newComponents.push(...configSequence);

  return newComponents;
}

function StepItem({
  step,
  disabled,
  fullSequence,
  startIndex,
  interruption,
  subSequence,
  participantView,
}: {
  step: string;
  disabled: boolean;
  fullSequence: Sequence;
  startIndex: number;
  interruption: boolean;
  subSequence?: Sequence;
  participantView: boolean;
}) {
  const studyId = useStudyId();
  const navigate = useNavigate();
  const currentStep = useCurrentStep();
  const studyConfig = useStudyConfig();
  const [opened, { close, open }] = useDisclosure(false);

  const task = step in studyConfig.components && studyConfig.components[step];

  const stepIndex = subSequence && subSequence.components.slice(startIndex).includes(step) ? findTaskIndexInSequence(fullSequence, step, startIndex, subSequence.orderPath) : -1;

  const active = participantView ? currentStep === stepIndex : currentStep === `reviewer-${step}`;

  return (
    <Popover withinPortal position="left" withArrow arrowSize={10} shadow="md" opened={opened} offset={20}>
      <Popover.Target>
        <Box
          onMouseEnter={open}
          onMouseLeave={close}
        >
          <NavLink
            active={active}
            style={{
              lineHeight: '32px',
              height: '32px',
            }}
            label={(
              <Box>
                {interruption && <IconBrain size={16} style={{ marginRight: 4, marginBottom: -2 }} color="orange" />}
                {active ? <Text size="sm" span fw="700" display="inline">{step}</Text> : <Text size="sm" display="inline">{step}</Text>}
              </Box>
            )}
            onClick={() => (participantView ? navigate(`/${studyId}/${stepIndex}`) : navigate(`/${studyId}/reviewer-${step}`))}
            disabled={disabled}
          />
        </Box>
      </Popover.Target>
      {task && (task.description || task.meta) && (
        <Popover.Dropdown onMouseLeave={close}>
          <Text size="sm">
            <Box>
              {task.description && (
                <Box>
                  <Text fw={900} display="inline-block" mr={2}>
                    Description:
                  </Text>
                  <Text fw={400} component="span">
                    {task.description}
                  </Text>
                </Box>
              )}
              {task.meta && (
                <Text>
                  <Text fw="900" component="span">Task Meta: </Text>
                  <Text component="pre" style={{ margin: 0, padding: 0 }}>{`${JSON.stringify(task.meta, null, 2)}`}</Text>
                </Text>
              )}
            </Box>
          </Text>
        </Popover.Dropdown>
      )}
    </Popover>
  );
}

export function StepsPanel({
  configSequence,
  fullSequence,
  participantSequence,
  participantView,
}: {
  configSequence: ComponentBlockWithOrderPath;
  fullSequence: Sequence;
  participantSequence?: Sequence;
  participantView: boolean;
}) {
  // If the participantSequence is provided, reorder the components
  let components = deepCopy(configSequence.components);
  if (participantSequence && participantView) {
    const reorderedComponents = reorderComponents(deepCopy(configSequence.components), deepCopy(participantSequence.components));
    components = reorderedComponents;
  }

  if (!participantView) {
    // Add interruptions to the sequence
    components = [
      ...(configSequence.interruptions?.flatMap((interruption) => interruption.components) || []),
      ...components,
    ];
  }

  return (
    <div>
      <Text>Hello darkness my old friend</Text>
      {/* {components.map((step, idx) => {
        if (typeof step === 'string') {
          return (
            <StepItem
              key={idx}
              step={step}
              disabled={participantView && participantSequence?.components[idx] !== step}
              fullSequence={fullSequence}
              startIndex={idx}
              interruption={(configSequence.interruptions && (configSequence.interruptions.findIndex((i) => i.components.includes(step)) > -1)) || false}
              subSequence={participantSequence}
              participantView={participantView}
            />
          );
        }

        const participantSubSequence = participantSequence?.components.find((s) => typeof s !== 'string' && s.orderPath === step.orderPath) as Sequence | undefined;

        // Count tasks - interruptions
        const sequenceStepsLength = participantSubSequence ? getSequenceFlatMap(participantSubSequence).length - countInterruptionsRecursively(step, participantSubSequence) : 0;
        const orderSteps = getSequenceFlatMap(step);

        return (
          <NavLink
            key={idx}
            label={(
              <Box
                style={{
                  opacity: sequenceStepsLength > 0 ? 1 : 0.5,
                }}
              >
                <Text size="sm" display="inline">
                  {step.order}
                </Text>
                {step.order === 'random' || step.order === 'latinSquare' ? (
                  <IconArrowsShuffle size="15" opacity={0.5} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />
                ) : null}
                {participantView && (
                <Badge ml={5} variant="light">
                  {sequenceStepsLength}
                  /
                  {orderSteps.length}
                </Badge>
                )}
                {participantView && step.interruptions && (
                <Badge ml={5} color="orange" variant="light">
                  {participantSubSequence?.components.filter((s) => typeof s === 'string' && step.interruptions?.flatMap((i) => i.components).includes(s)).length || 0}
                </Badge>
                )}
              </Box>
            )}
            defaultOpened
            childrenOffset={32}
            style={{
              lineHeight: '32px',
              height: '32px',
            }}
          >
            <Box style={{ borderLeft: '1px solid #e9ecef' }}>
              <StepsPanel configSequence={step} participantSequence={participantSubSequence} fullSequence={fullSequence} participantView={participantView} />
            </Box>
          </NavLink>
        );
      })} */}
    </div>
  );
}
