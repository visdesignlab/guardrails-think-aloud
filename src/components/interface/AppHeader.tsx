import {
  ActionIcon,
  AppShell,
  Badge,
  Button,
  Flex,
  Grid,
  Group,
  Image,
  Menu,
  Progress,
  Space,
  Title,
  Text,
  Box,
  Tooltip,
} from '@mantine/core';
import {
  IconDotsVertical,
  IconMail,
  IconMicrophone,
  IconSchema,
  IconUserPlus,
} from '@tabler/icons-react';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useHref } from 'react-router-dom';
import { WaveForm, WaveSurfer } from 'wavesurfer-react';
import WaveSurferRef from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record';
import RecordingAudioWaveform from './RecordingAudioWaveform';
import {
  useStoreDispatch, useStoreSelector, useStoreActions, useFlatSequence,
} from '../../store/store';
import { useStorageEngine } from '../../storage/storageEngineHooks';
import { PREFIX } from '../../utils/Prefix';
import { useCurrentStep, useStudyId } from '../../routes/utils';
import { getNewParticipant } from '../../utils/nextParticipant';

export default function AppHeader({ studyNavigatorEnabled, dataCollectionEnabled }: { studyNavigatorEnabled: boolean; dataCollectionEnabled: boolean }) {
  const { config: studyConfig, metadata } = useStoreSelector((state) => state);
  const flatSequence = useFlatSequence();
  const storeDispatch = useStoreDispatch();
  const { toggleShowHelpText, toggleStudyBrowser } = useStoreActions();
  const { storageEngine } = useStorageEngine();

  const isRecording = useStoreSelector((store) => store.isRecording);

  const currentStep = useCurrentStep();

  const progressBarMax = flatSequence.length - 1;
  const progressPercent = typeof currentStep === 'number' ? (currentStep / progressBarMax) * 100 : 0;

  const [menuOpened, setMenuOpened] = useState(false);

  const logoPath = studyConfig?.uiConfig.logoPath;
  const withProgressBar = studyConfig?.uiConfig.withProgressBar;

  const studyId = useStudyId();
  const studyHref = useHref(`/${studyId}`);

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.offsetWidth);
    }
  }, [studyConfig]);

  return (
    <AppShell.Header p="md">
      <Grid mt={-7} align="center">
        <Grid.Col span={4}>
          <Flex align="center">
            <Image w={40} src={`${PREFIX}${logoPath}`} alt="Study Logo" />
            <Space w="md" />
            <Title order={4}>{studyConfig?.studyMetadata.title}</Title>
            {isRecording ? (
              <Group gap={20} wrap="nowrap">
                <Text color="red">Recording audio</Text>
                <RecordingAudioWaveform />
              </Group>
            ) : null}
          </Flex>
        </Grid.Col>

        <Grid.Col span={4}>
          {withProgressBar && (
            <Progress radius="md" size="lg" value={progressPercent} />
          )}
        </Grid.Col>

        <Grid.Col span={4}>
          <Group wrap="nowrap" justify="right">
            {!dataCollectionEnabled && <Tooltip multiline withArrow arrowSize={6} w={300} label="This is a demo version of the study, we’re not collecting any data."><Badge size="lg" color="orange">Demo Mode</Badge></Tooltip>}
            {studyConfig?.uiConfig.helpTextPath !== undefined && (
              <Button
                variant="outline"
                onClick={() => storeDispatch(toggleShowHelpText())}
              >
                Help
              </Button>
            )}

            <Menu
              shadow="md"
              width={200}
              withinPortal
              opened={menuOpened}
              onChange={setMenuOpened}
            >
              <Menu.Target>
                <ActionIcon size="lg" className="studyBrowserMenuDropdown" variant="subtle" color="gray">
                  <IconDotsVertical />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {studyNavigatorEnabled && (
                  <Menu.Item
                    leftSection={<IconSchema size={14} />}
                    onClick={() => storeDispatch(toggleStudyBrowser())}
                  >
                    Study Browser
                  </Menu.Item>
                )}

                <Menu.Item
                  component="a"
                  href={
                      studyConfig !== null
                        ? `mailto:${studyConfig.uiConfig.contactEmail}`
                        : undefined
                    }
                  leftSection={<IconMail size={14} />}
                >
                  Contact
                </Menu.Item>

                {studyNavigatorEnabled && (
                  <Menu.Item
                    leftSection={<IconUserPlus size={14} />}
                    onClick={() => getNewParticipant(storageEngine, studyConfig, metadata, studyHref)}
                  >
                    Next Participant
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Grid.Col>
      </Grid>
    </AppShell.Header>
  );
}
