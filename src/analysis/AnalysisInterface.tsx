import {
  AppShell, Container, Flex, LoadingOverlay, Space, Tabs,
  Title,
  Tooltip,
  Alert,
  Box,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconChartDonut2, IconPlayerPlay, IconTable, IconSettings, IconInfoCircle,
} from '@tabler/icons-react';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import AppHeader from './components/interface/AppHeader';
import { GlobalConfig, ParticipantData, StudyConfig } from '../parser/types';
import { getStudyConfig } from '../utils/fetchConfig';
import { TableView } from './table/TableView';
import { useStorageEngine } from '../storage/storageEngineHooks';
import { ParticipantStatusBadges } from './components/interface/ParticipantStatusBadges';
import ManageAccordion from './management/ManageAccordion';
import { useAuth } from '../store/hooks/useAuth';
import { ThinkAloudTable } from './thinkAloudTable/ThinkAloudTable';

export function AnalysisInterface(props: { globalConfig: GlobalConfig; }) {
  const { globalConfig } = props;
  const { studyId } = useParams();
  const [expData, setExpData] = useState<ParticipantData[]>([]);
  const [studyConfig, setStudyConfig] = useState<StudyConfig | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const { storageEngine } = useStorageEngine();
  const navigate = useNavigate();
  const { tab } = useParams();
  const { user } = useAuth();

  const getData = useCallback(async () => {
    setLoading(true);
    if (studyId) {
      const cf = await getStudyConfig(studyId, globalConfig);
      if (!cf || !storageEngine) return;
      await storageEngine.initializeStudyDb(studyId, cf);
      const data = (await storageEngine.getAllParticipantsData());
      setExpData(data);
      setStudyConfig(cf);
      setLoading(false);
    }
  }, [globalConfig, storageEngine, studyId]);

  useEffect(() => {
    getData();
  }, [globalConfig, storageEngine, studyId, getData]);

  const [completed, inProgress, rejected] = useMemo(() => {
    const comp = expData.filter((d) => !d.rejected && d.completed);
    const prog = expData.filter((d) => !d.rejected && !d.completed);
    const rej = expData.filter((d) => d.rejected);
    return [comp, prog, rej];
  }, [expData]);

  return (
    <AppShell style={{ height: '100%' }}>
      <AppHeader studyIds={props.globalConfig.configsList} />
      <AppShell.Main>
        <Box p="sm" style={{ height: '100%', minHeight: '100%', width: '100%' }}>
          <LoadingOverlay visible={loading} />

          <Flex direction="row" align="center">
            <Title order={5}>{studyId}</Title>
            <ParticipantStatusBadges completed={completed.length} inProgress={inProgress.length} rejected={rejected.length} />
          </Flex>

          <Space h="xs" />

          <Tabs variant="outline" value={tab} onChange={(value) => navigate(`./../${value}`)} style={{ height: '100%' }}>
            <Tabs.List>
              <Tabs.Tab value="table" leftSection={<IconTable size={16} />}>Table View</Tabs.Tab>
              <Tooltip label="Coming soon" position="bottom">
                <Tabs.Tab value="stats" leftSection={<IconChartDonut2 size={16} />} disabled>Trial Stats</Tabs.Tab>
              </Tooltip>
              <Tooltip label="Coming soon" position="bottom">
                <Tabs.Tab value="replay" leftSection={<IconPlayerPlay size={16} />} disabled>Participant Replay</Tabs.Tab>
              </Tooltip>
              <Tabs.Tab value="thinkAloud" leftSection={<IconPlayerPlay size={16} />}>Think Aloud</Tabs.Tab>

              <Tabs.Tab value="manage" leftSection={<IconSettings size={16} />} disabled={!user.isAdmin}>Manage</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="table" pt="xs">
              {studyConfig && <TableView completed={completed} inProgress={inProgress} studyConfig={studyConfig} refresh={getData} />}
            </Tabs.Panel>

            <Tabs.Panel value="stats" pt="xs">
              statsboard
            </Tabs.Panel>
            <Tabs.Panel value="replay" pt="xs">
              Replay Tab Content
            </Tabs.Panel>
            <Tabs.Panel value="thinkAloud" pt="xs">
              {studyConfig && <ThinkAloudTable completed={completed} studyConfig={studyConfig} />}
            </Tabs.Panel>
            <Tabs.Panel value="manage" pt="xs">
              {studyId && user.isAdmin ? <ManageAccordion studyId={studyId} refresh={getData} /> : <Container mt={20}><Alert title="Unauthorized Access" variant="light" color="red" icon={<IconInfoCircle />}>You are not authorized to manage the data for this study.</Alert></Container>}
            </Tabs.Panel>
          </Tabs>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
