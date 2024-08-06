import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ModalsProvider } from '@mantine/modals';
import { AppShell } from '@mantine/core';
import ConfigSwitcher from './components/ConfigSwitcher';
import { Shell } from './components/Shell';
import { parseGlobalConfig } from './parser/parser';
import { GlobalConfig, Nullable, ParsedStudyConfig } from './parser/types';
import { AnalysisInterface } from './analysis/AnalysisInterface';
import { PREFIX } from './utils/Prefix';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from './Login';
import { AuthProvider } from './store/hooks/useAuth';
import { AnalysisDashboard } from './analysis/AnalysisDashboard';
import { GlobalSettings } from './analysis/dashboard/GlobalSettings';
import { NavigateWithParams } from './utils/NavigateWithParams';
import AppHeader from './analysis/components/interface/AppHeader';
import { fetchStudyConfigs } from './utils/fetchConfig';
import { initializeStorageEngine } from './storage/initialize';
import { useStorageEngine } from './storage/storageEngineHooks';
import { FirebaseStorageEngine } from './storage/engines/FirebaseStorageEngine';

async function fetchGlobalConfigArray() {
  const globalFile = await fetch(`${PREFIX}global.json`);
  const configs = await globalFile.text();
  return parseGlobalConfig(configs);
}

export function GlobalConfigParser() {
  const [globalConfig, setGlobalConfig] = useState<Nullable<GlobalConfig>>(null);
  const [studyConfigs, setStudyConfigs] = useState<Record<string, ParsedStudyConfig | null>>({});

  useEffect(() => {
    async function fetchData() {
      if (globalConfig) {
        setStudyConfigs(await fetchStudyConfigs(globalConfig));
      }
    }
    fetchData();
  }, [globalConfig]);

  useEffect(() => {
    if (globalConfig) return;

    fetchGlobalConfigArray().then((gc) => {
      setGlobalConfig(gc);
    });
  }, [globalConfig]);

  // Initialize storage engine
  const { storageEngine, setStorageEngine } = useStorageEngine();
  useEffect(() => {
    if (storageEngine !== undefined) return;

    async function fn() {
      const _storageEngine = await initializeStorageEngine();
      setStorageEngine(_storageEngine);
    }
    fn();
  }, [setStorageEngine, storageEngine]);

  const analysisProtectedCallback = async (studyId:string) => {
    if (storageEngine instanceof FirebaseStorageEngine) {
      const modes = await storageEngine.getModes(studyId);
      if (modes.analyticsInterfacePubliclyAccessible) {
        // If accessible, disable
        return false;
      }
      // If not accessible, enable protection
      return true;
    }
    return false;
  };

  return globalConfig ? (
    <BrowserRouter basename={PREFIX}>
      <AuthProvider>
        <ModalsProvider>
          <AppShell
            padding="md"
            header={{ height: 70 }}
          >
            <Routes>
              <Route
                path="/"
                element={(
                  <>
                    <AppHeader studyIds={globalConfig.configsList} />
                    <ConfigSwitcher
                      globalConfig={globalConfig}
                      studyConfigs={studyConfigs}
                    />
                  </>
            )}
              />
              <Route
                path="/:studyId/*"
                element={<Shell globalConfig={globalConfig} />}
              />
              <Route
                path="/analysis/dashboard"
                element={(
                  <AnalysisDashboard
                    globalConfig={globalConfig}
                  />
              )}
              />
              <Route
                path="/analysis"
                element={<NavigateWithParams to="/analysis/dashboard" />}
              />
              <Route
                path="/analysis/stats/:studyId/:tab"
                // loader={(params)=>{
                //   console.log(params)
                //   return false;
                // }}
                element={(
                  <ProtectedRoute paramToCheck="studyId" paramCallback={analysisProtectedCallback}>
                    <AnalysisInterface
                      globalConfig={globalConfig}
                    />
                  </ProtectedRoute>
            )}
              />
              <Route
                path="/analysis/stats/:studyId"
                element={<NavigateWithParams to="./table" replace />}
              />
              <Route
                path="/settings"
                element={(
                  <AppShell>
                    <ProtectedRoute>
                      <AppHeader studyIds={globalConfig.configsList} />
                      <AppShell.Main>
                        <GlobalSettings />
                      </AppShell.Main>
                    </ProtectedRoute>
                  </AppShell>
            )}
              />
              <Route
                path="/login"
                element={(
                  <AppShell>
                    <AppHeader studyIds={globalConfig.configsList} />
                    <AppShell.Main>
                      <Login />
                    </AppShell.Main>
                  </AppShell>
            )}
              />
            </Routes>
          </AppShell>
        </ModalsProvider>
      </AuthProvider>
    </BrowserRouter>
  ) : null;
}
