/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppShell } from '@mantine/core';
import { AnalysisPopout } from './AnalysisPopout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Analysis({ setProvState } : {setProvState: (state: any) => void}) {
  // useEffect(() => {
  //   const externalWindow = window.open(
  //     current.pathname,
  //     'chromeTab',
  //     'rel=noreferrer',
  //   )!;

  //   // externalWindow.document.body.appendChild(containerEl);
  //   // externalWindow.document.head.innerHTML = window.document.head.innerHTML;

  //   popoutRef.current = externalWindow;
  //   return () => {
  //     externalWindow.close();
  //   };
  // }, []);

  return (
    <div>
      <AppShell.Main p="sm">
        <AnalysisPopout mini={false} />
      </AppShell.Main>
    </div>
  );
}
