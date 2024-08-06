import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Provider } from 'react-redux';
import {
  RouteObject, useLocation, useMatch, useParams, useRoutes, useSearchParams,
} from 'react-router-dom';
import { AppShell, LoadingOverlay, Title } from '@mantine/core';
import {
  GlobalConfig,
  Nullable,
  ParsedStudyConfig,
} from '../parser/types';
import { useStudyId } from '../routes/utils';
import {
  StudyStoreContext,
  StudyStore,
  studyStoreCreator,
  useStoreDispatch,
  useStoreActions,
  useStoreSelector,
} from '../store/store';

import ComponentController from '../controllers/ComponentController';
import { NavigateWithParams } from '../utils/NavigateWithParams';
import { StudyEnd } from './StudyEnd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
import { generateSequenceArray } from '../utils/handleRandomSequences';
import { StepRenderer } from './StepRenderer';
import { ProvenanceWrapper } from './interface/audioAnalysis/ProvenanceWrapper';
import { StorageEngine } from '../storage/engines/StorageEngine';
import { AnalysisHome } from './interface/audioAnalysis/AnalysisHome';
import { Analysis } from './interface/audioAnalysis/Analysis';
import { parseStudyConfig } from '../parser/parser';
import { PREFIX } from '../utils/Prefix';
import { getStudyConfig } from '../utils/fetchConfig';
import { ParticipantMetadata } from '../store/types';
import { ErrorLoadingConfig } from './ErrorLoadingConfig';
import ResourceNotFound from '../ResourceNotFound';
import { useAuth } from '../store/hooks/useAuth';
import { useStorageEngine } from '../storage/storageEngineHooks';

export function GenerateStudiesRoutes({ studyId, config }: {
  studyId: Nullable<string>,
  config: Nullable<ParsedStudyConfig>
  }) {
  const { sequence } = useStoreSelector((state) => state);

  const routes = useMemo(() => {
    if (studyId && config && sequence) {
      const stepRoutes: RouteObject[] = [];

      stepRoutes.push({
        path: '/',
        element: <NavigateWithParams to="0" replace />,
      });

      stepRoutes.push({
        path: '/:index',
        element: config.errors.length > 0 ? (
          <>
            <Title order={2} mb={8}>Error loading config</Title>
            <ErrorLoadingConfig issues={config.errors} type="error" />
          </>
        ) : <ComponentController />,
      });

      stepRoutes.push({
        path: '/analysis/:trrackId/:index/',
        element: <ComponentController />,
      });

      stepRoutes.push({
        path: '/analysis/:trrackId/ui/:index?/',
        element: <AppShell header={{ height: 70 }} navbar={{ collapsed: { desktop: true, mobile: true }, width: 0, breakpoint: 'xs' }} aside={{ collapsed: { desktop: true, mobile: true }, width: 0, breakpoint: 'xs' }}><Analysis setProvState={() => null} /></AppShell>,
      });

      stepRoutes.push({
        path: '/analysis',
        element: <AnalysisHome />,
      });

      stepRoutes.push({
        path: '/end',
        element: <StudyEnd />,
      });

      const studyRoute: RouteObject = {
        element: <StepRenderer />,
        children: stepRoutes,
      };

      return [studyRoute];
    }
    return [];
  }, [config, sequence, studyId]);

  return useRoutes(routes);
}

export function Shell({ globalConfig }: {
  globalConfig: GlobalConfig;
}) {
  // Pull study config
  const studyId = useStudyId();
  const [activeConfig, setActiveConfig] = useState<ParsedStudyConfig | null>(null);
  const isValidStudyId = globalConfig.configsList.includes(studyId);

  useEffect(() => {
    getStudyConfig(studyId, globalConfig).then((config) => {
      setActiveConfig(config);
    });
  }, [globalConfig, studyId]);

  const [store, setStore] = useState<Nullable<StudyStore>>(null);
  const { storageEngine } = useStorageEngine();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    async function initializeUserStoreRouting() {
      // Check that we have a storage engine and active config (studyId is set for config, but typescript complains)
      if (!storageEngine || !activeConfig || !studyId) return;

      // Make sure that we have a study database and that the study database has a sequence array
      await storageEngine.initializeStudyDb(studyId, activeConfig);
      const sequenceArray = await storageEngine.getSequenceArray();
      if (!sequenceArray) {
        await storageEngine.setSequenceArray(await generateSequenceArray(activeConfig));
      }

      // Get or generate participant session
      const urlParticipantId = activeConfig.uiConfig.urlParticipantIdParam ? searchParams.get(activeConfig.uiConfig.urlParticipantIdParam) || undefined : undefined;
      const searchParamsObject = Object.fromEntries(searchParams.entries());

      const ipRes = await fetch('https://api.ipify.org?format=json').catch((_) => '');
      const ip: { ip: string } = ipRes instanceof Response ? await ipRes.json() : { ip: '' };

      const metadata: ParticipantMetadata = {
        language: navigator.language,
        userAgent: navigator.userAgent,
        resolution: {
          width: window.screen.width, height: window.screen.height, availHeight: window.screen.availHeight, availWidth: window.screen.availWidth, colorDepth: window.screen.colorDepth, orientation: window.screen.orientation.type, pixelDepth: window.screen.pixelDepth,
        },
        ip: ip.ip,
      };

      const participantSession = await storageEngine.initializeParticipantSession(studyId, searchParamsObject, activeConfig, metadata, urlParticipantId);

      // Initialize the redux stores
      const newStore = await studyStoreCreator(studyId, activeConfig, participantSession.sequence, metadata, participantSession.answers);
      setStore(newStore);
    }
    initializeUserStoreRouting();
  }, [storageEngine, activeConfig, studyId, searchParams]);

  // const routing = useRoutes(routes);

  const loaderOrRouting = !store ? <LoadingOverlay visible />
    : (
      <StudyStoreContext.Provider value={store}>
        <Provider store={store.store}>
          <GenerateStudiesRoutes studyId={studyId} config={activeConfig} />
        </Provider>
      </StudyStoreContext.Provider>
    );

  return loaderOrRouting;
}
