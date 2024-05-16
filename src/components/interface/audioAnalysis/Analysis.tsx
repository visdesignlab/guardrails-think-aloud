/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { Registry, initializeTrrack } from '@trrack/core';
import { createPortal } from 'react-dom';
import { useStorageEngine } from '../../../store/storageEngineHooks';
import { useAsync } from '../../../store/hooks/useAsync';
import { StorageEngine } from '../../../storage/engines/StorageEngine';

import { deepCopy } from '../../../utils/deepCopy';
import { AnalysisPopout } from './AnalysisPopout';

// import WaveSurfer from 'wavesurfer.js';

function getParticipantData(trrackId: string | undefined, storageEngine: StorageEngine | undefined) {
  if (storageEngine) {
    return storageEngine.getParticipantData(trrackId);
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Analysis({ setProvState } : {setProvState: (state: any) => void}) {
  const popoutRef = useRef<Window>();

  const containerEl = useMemo(() => document.createElement('div'), []);

  const navigate = useNavigate();
  const current = useLocation();

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

  const updateCss = useCallback(() => {
    if (popoutRef.current) {
      popoutRef.current.document.head.innerHTML = window.document.head.innerHTML;
    }
  }, []);

  return (
    <div>
      <AnalysisPopout setProvState={setProvState} popoutWindow={popoutRef.current || document as any} cssUpdate={updateCss} />
    </div>
  );
}
