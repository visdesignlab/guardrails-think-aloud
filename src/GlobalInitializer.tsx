import { useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { useStorageEngine } from './storage/storageEngineHooks';
import { GlobalConfigParser } from './GlobalConfigParser';
import { initializeStorageEngine } from './storage/initialize';

export function GlobalInitializer() {
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

  return (
    <AppShell padding="md" header={{ height: 70 }} aside={{ collapsed: { desktop: true, mobile: true }, breakpoint: 'xs', width: 0 }} navbar={{ collapsed: { desktop: true, mobile: true }, breakpoint: 'xs', width: 0 }}>
      <GlobalConfigParser />
    </AppShell>
  );
}
