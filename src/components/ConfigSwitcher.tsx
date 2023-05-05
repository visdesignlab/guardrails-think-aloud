import { Card, Container, Text, UnstyledButton, Image } from '@mantine/core';
import { GlobalConfig } from '../parser/types';
import { sanitizeStringForUrl } from '../utils/sanitizeStringForUrl';
import { useNavigateWithParams } from '../utils/useNavigateWithParams';

export const PREFIX = import.meta.env.PROD
  ? import.meta.env.VITE_BASE_PATH
  : '/';

type Props = {
  globalConfig: GlobalConfig;
};

const ConfigSwitcher = ({ globalConfig }: Props) => {
  const { configs, configsList } = globalConfig;
  const navigate = useNavigateWithParams();

  return (
      <Container size="xs" px="xs" style={{ marginTop: 100, marginBottom: 100 }}>
        <Image maw={150} mx="auto" mb="xl" radius="md" src={`${PREFIX}assets/revisitLogoSquare.svg`} alt="reVISit" />
        <Text>Select an experiment to launch:</Text>
        {configsList.map((configName) => {
          const config = configs[configName];
          const url = sanitizeStringForUrl(config.title);

          return (
              <UnstyledButton
                  key={config.title}
                  onClick={() => {
                    navigate(`/${url}`);
                  }}
                  my="sm"
                  style={{ width: '100%' }}
              >
                <Card shadow="sm" radius="md" withBorder>
                  <Text fw="bold">{config.title}</Text>
                  <Text c="dimmed">{config.description}</Text>
                </Card>
              </UnstyledButton>
          );
        })}
      </Container>
  );
};

export default ConfigSwitcher;