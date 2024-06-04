import {
  ActionIcon,
  Badge,
  Button,
  Flex,
  Grid,
  Group,
  Header,
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
import { useAuth } from '../../store/hooks/useAuth';
import { useCurrentStep, useStudyId } from '../../routes/utils';

export default function AppHeader() {
  const { config: studyConfig, metadata } = useStoreSelector((state) => state);
  const flatSequence = useFlatSequence();
  const storeDispatch = useStoreDispatch();
  const { toggleShowHelpText, toggleStudyBrowser } = useStoreActions();
  const { storageEngine } = useStorageEngine();

  const isRecording = useStoreSelector((store) => store.isRecording);

  const currentStep = useCurrentStep();

  const auth = useAuth();

  const progressBarMax = flatSequence.length - 1;
  const progressPercent = (currentStep / progressBarMax) * 100;

  const [menuOpened, setMenuOpened] = useState(false);

  const logoPath = studyConfig?.uiConfig.logoPath;
  const withProgressBar = studyConfig?.uiConfig.withProgressBar;

  const studyId = useStudyId();
  const studyHref = useHref(`/${studyId}`);

  function getNewParticipant() {
    storageEngine?.nextParticipant(studyConfig, metadata)
      .then(() => {
        window.location.href = studyHref;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = titleRef.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.offsetWidth);
    }
  }, [studyConfig]);

  return (
    <Header height="70" p="md">
      <Grid mt={-7} align="center">
        <Grid.Col span={4}>
          <Group align="center" noWrap>
            <Image maw={40} src={`${PREFIX}${logoPath}`} alt="Study Logo" />
            <Space w="md" />
            <Title order={4}>{studyConfig?.studyMetadata.title}</Title>
            {isRecording ? (
              <Group spacing={20} noWrap>
                <Text color="red">Recording audio</Text>
                <RecordingAudioWaveform />
              </Group>
            ) : null}
          </Group>
        </Grid.Col>

        <Grid.Col span={4}>
          {withProgressBar && (
            <Progress radius="md" size="lg" value={progressPercent} />
          )}
        </Grid.Col>

        <Grid.Col span={4}>
          <Group noWrap position="right">
            {import.meta.env.VITE_REVISIT_MODE === 'public' ? <Tooltip multiline withArrow arrowSize={6} width={300} label="This is a demo version of the study, we’re not collecting any data. Navigate the study via the study browser on the right."><Badge size="lg" color="orange">Demo Mode</Badge></Tooltip> : null}
            {studyConfig?.uiConfig.helpTextPath !== undefined && (
              <Button
                variant="outline"
                onClick={() => storeDispatch(toggleShowHelpText())}
              >
                Help
              </Button>
            )}

            {(import.meta.env.DEV || import.meta.env.VITE_REVISIT_MODE === 'public' || auth.user.isAdmin) && (
              <Menu
                shadow="md"
                width={200}
                zIndex={1}
                opened={menuOpened}
                onChange={setMenuOpened}
              >
                <Menu.Target>
                  <ActionIcon size="lg" className="studyBrowserMenuDropdown">
                    <IconDotsVertical />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    icon={<IconSchema size={14} />}
                    onClick={() => storeDispatch(toggleStudyBrowser())}
                  >
                    Study Browser
                  </Menu.Item>

                  <Menu.Item
                    component="a"
                    href={
                      studyConfig !== null
                        ? `mailto:${studyConfig.uiConfig.contactEmail}`
                        : undefined
                    }
                    icon={<IconMail size={14} />}
                  >
                    Contact
                  </Menu.Item>

                  <Menu.Item
                    icon={<IconSchema size={14} />}
                    onClick={() => getNewParticipant()}
                  >
                    Next Participant
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Grid.Col>
      </Grid>
    </Header>
  );
}
