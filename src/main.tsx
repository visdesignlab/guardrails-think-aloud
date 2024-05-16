import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { StorageEngineProvider } from './store/storageEngineHooks';
import { GlobalInitializer } from './components/GlobalInitializer';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StorageEngineProvider>
      <MantineProvider
        theme={{
          components: {
            roo: {
            // Subscribe to theme and component params
              styles: () => ({
                mark: {
                  backgroundColor: 'transparent',
                  color: 'cornflowerblue',
                },
              }),
            },
          },
        }}
      >
        <GlobalInitializer />
      </MantineProvider>
    </StorageEngineProvider>
  </React.StrictMode>,
);
