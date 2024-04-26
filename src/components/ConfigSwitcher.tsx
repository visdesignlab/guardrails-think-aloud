import {
  Anchor, Card, Container, Flex, Image, List, Text, UnstyledButton,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ErrorObject } from 'ajv';
import { GlobalConfig, StudyConfig } from '../parser/types';
import { sanitizeStringForUrl } from '../utils/sanitizeStringForUrl';
import { PREFIX } from '../utils/Prefix';
import { useAuth } from '../store/hooks/useAuth';
import { useStorageEngine } from '../storage/storageEngineHooks';

const REVISIT_GITHUB_PUBLIC = 'https://github.com/revisit-studies/study/tree/main/public/';

type Props = {
  globalConfig: GlobalConfig;
  studyConfigs: {[key: string]: StudyConfig & { errors?: ErrorObject<string, Record<string, unknown>, unknown>[] }};
};

function ConfigSwitcher({ globalConfig, studyConfigs }: Props) {
  const { configsList } = globalConfig;
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { storageEngine } = useStorageEngine();

  return (
    <Container size="xs" px="xs" style={{ marginTop: 100, marginBottom: 100 }}>
      {storageEngine?.getEngine() === 'firebase' ? (
        <UnstyledButton
          style={{ position: 'absolute', top: '30px', right: '30px' }}
          onClick={() => {
            logout();
          }}
        >
          Logout
        </UnstyledButton>
      ) : null}
      <Image
        maw={150}
        mx="auto"
        mb="xl"
        radius="md"
        src={`${PREFIX}revisitAssets/revisitLogoSquare.svg`}
        alt="reVISit"
      />
      <Text>Select an experiment to launch:</Text>
      {configsList.map((configName) => {
        const config = studyConfigs[configName];
        if (!config) {
          return null;
        }
        const url = sanitizeStringForUrl(configName);

        return (
          <UnstyledButton
            key={configName}
            onClick={() => {
              navigate(`/${url}`);
            }}
            my="sm"
            style={{ width: '100%' }}
          >
            <Card shadow="sm" radius="md" withBorder>
              {config.errors
                ? (
                  <>
                    <Flex align="center" direction="row">
                      <IconAlertTriangle color="red" />
                      <Text fw="bold" ml={8}>{configName}</Text>
                    </Flex>
                    <Text>Errors when loading config:</Text>
                    <List>
                      {config.errors.map((error) => (
                        <List.Item key={error.message} c="red">
                          You have an error at
                          {' '}
                          {error.instancePath || 'root'}
                          :
                          {' '}
                          {error.message}
                          {' '}
                          -
                          {' '}
                          {JSON.stringify(error.params)}
                        </List.Item>
                      ))}
                    </List>
                  </>
                )
                : (
                  <>
                    <Text fw="bold">{config.studyMetadata.title}</Text>
                    <Text c="dimmed">
                      Authors:
                      {config.studyMetadata.authors}
                    </Text>
                    <Text c="dimmed">{config.studyMetadata.description}</Text>
                    <Text c="dimmed" ta="right" style={{ paddingRight: 5 }}>
                      <Anchor
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        href={`${REVISIT_GITHUB_PUBLIC}${url}`}
                      >
                        View source:
                        {' '}
                        {url}
                      </Anchor>
                    </Text>
                  </>
                )}
            </Card>
          </UnstyledButton>
        );
      })}

    </Container>
  );
}

export default ConfigSwitcher;
