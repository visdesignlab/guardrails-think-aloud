import {
  createSlice, configureStore, type PayloadAction, applyMiddleware,
} from '@reduxjs/toolkit';
import { createContext, useContext } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { createStateSyncMiddleware, initMessageListener, initStateWithPrevTab } from 'redux-state-sync';
import { ResponseBlockLocation, StudyConfig } from '../parser/types';
import {
  StoredAnswer, TrialValidation, TrrackedProvenance, StoreState, Sequence, ParticipantMetadata,
} from './types';
import { getSequenceFlatMap } from '../utils/getSequenceFlatMap';

export async function studyStoreCreator(
  studyId: string,
  config: StudyConfig,
  sequence: Sequence,
  metadata: ParticipantMetadata,
  answers: Record<string, StoredAnswer>,
  isAdmin: boolean,
) {
  const flatSequence = getSequenceFlatMap(sequence);

  const emptyAnswers = { ...flatSequence.map((id) => ({ [id]: {} })) };
  const emptyValidation: TrialValidation = Object.assign(
    {},
    ...flatSequence.map((id, idx) => ({ [`${id}_${idx}`]: { aboveStimulus: { valid: false, values: {} }, belowStimulus: { valid: false, values: {} }, sidebar: { valid: false, values: {} } } })),
  );
  const allValid = Object.assign(
    {},
    ...flatSequence.map((id, idx) => ({
      [`${id}_${idx}`]: {
        aboveStimulus: true, belowStimulus: true, sidebar: true, values: {},
      },
    })),
  );

  const initialState: StoreState = {
    studyId,
    answers: answers || emptyAnswers,
    isRecording: false,
    sequence,
    config,
    showStudyBrowser: import.meta.env.VITE_REVISIT_MODE === 'public' || isAdmin,
    showHelpText: false,
    alertModal: { show: false, message: '' },
    trialValidation: answers ? allValid : emptyValidation,
    iframeAnswers: {},
    iframeProvenance: null,
    metadata,
    analysisTrialName: null,
    analysisProvState: null,
  };

  const storeSlice = createSlice({
    name: 'storeSlice',
    initialState,
    reducers: {
      setConfig(state, payload: PayloadAction<StudyConfig>) {
        state.config = payload.payload;
      },
      setIsRecording(state, payload: PayloadAction<boolean>) {
        state.isRecording = payload.payload;
      },
      toggleStudyBrowser: (state) => {
        state.showStudyBrowser = !state.showStudyBrowser;
      },
      toggleShowHelpText: (state) => {
        state.showHelpText = !state.showHelpText;
      },
      setAlertModal: (state, action: PayloadAction<{ show: boolean; message: string }>) => {
        state.alertModal = action.payload;
      },
      setIframeAnswers: (state, action: PayloadAction<Record<string, unknown>>) => {
        state.iframeAnswers = action.payload;
      },
      setAnalysisTrialName: (state, action: PayloadAction<string | null>) => {
        state.analysisTrialName = action.payload;
      },
      setIframeProvenance: (state, action: PayloadAction<TrrackedProvenance | null>) => {
        state.iframeProvenance = action.payload;
      },
      updateResponseBlockValidation: (
        state,
        {
          payload,
        }: PayloadAction<{
          location: ResponseBlockLocation;
          identifier: string;
          status: boolean;
          values: object;
          provenanceGraph?: TrrackedProvenance;
        }>,
      ) => {
        if (!state.trialValidation[payload.identifier]) {
          state.trialValidation[payload.identifier] = {
            aboveStimulus: { valid: false, values: {} },
            belowStimulus: { valid: false, values: {} },
            sidebar: { valid: false, values: {} },
            provenanceGraph: undefined,
          };
        }
        state.trialValidation[payload.identifier][payload.location] = { valid: payload.status, values: payload.values };

        if (payload.provenanceGraph) {
          state.trialValidation[payload.identifier].provenanceGraph = payload.provenanceGraph;
        }
      },
      saveAnalysisState(state, { payload } : PayloadAction<unknown>) {
        state.analysisProvState = payload;
      },
      saveTrialAnswer(
        state,
        {
          payload,
        }: PayloadAction<{ identifier: string } & StoredAnswer>,
      ) {
        const {
          identifier, answer, startTime, endTime, provenanceGraph, windowEvents,
        } = payload;
        state.answers[identifier] = {
          answer,
          startTime,
          endTime,
          provenanceGraph,
          windowEvents,
        };
      },
    },
  });

  const middlewares = [createStateSyncMiddleware({})];

  const store = configureStore(
    {
      reducer: storeSlice.reducer,
      preloadedState: initialState,
      middleware: middlewares,
    },
  );

  initStateWithPrevTab(store);

  return { store, actions: storeSlice.actions };
}

export type StudyStore = Awaited<ReturnType<typeof studyStoreCreator>>;

export const StudyStoreContext = createContext<StudyStore>(null!);

export function useStoreActions() {
  return useContext(StudyStoreContext).actions;
}

// Hooks
type StoreDispatch = StudyStore['store']['dispatch'];

export const useStoreDispatch: () => StoreDispatch = useDispatch;
export const useStoreSelector: TypedUseSelectorHook<StoreState> = useSelector;

export function useAreResponsesValid(id: string) {
  return useStoreSelector((state) => {
    const valid = Object.values(state.trialValidation[id]).every((x) => {
      if (typeof x === 'object' && 'valid' in x) {
        return x.valid;
      }
      return true;
    });

    if (!valid) return false;

    return Object.values(valid).every((x) => x);
  });
}

export function useFlatSequence(): string[] {
  return useStoreSelector((state) => getSequenceFlatMap(state.sequence));
}
