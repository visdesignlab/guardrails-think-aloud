import { Suspense, useEffect, useState } from 'react';
import merge from 'lodash.merge';
import { useNavigate, useParams } from 'react-router-dom';
import IframeController from './IframeController';
import ImageController from './ImageController';
import MarkdownController from './MarkdownController';
import { useStudyConfig } from '../store/hooks/useStudyConfig';
import { useCurrentComponent, useCurrentStep } from '../routes/utils';
import { useStoredAnswer } from '../store/hooks/useStoredAnswer';
import ReactMarkdownWrapper from '../components/ReactMarkdownWrapper';
import { isInheritedComponent } from '../parser/parser';
import { IndividualComponent } from '../parser/types';
import {
  useStoreActions, useStoreDispatch, useStoreSelector, useFlatSequence,
} from '../store/store';
import { useDisableBrowserBack } from '../utils/useDisableBrowserBack';
import { useStorageEngine } from '../storage/storageEngineHooks';
import { StudyEnd } from '../components/StudyEnd';
import ResponseBlock from '../components/response/ResponseBlock';
import ResourceNotFound from '../ResourceNotFound';
import ReactComponentController from './ReactComponentController';

// current active stimuli presented to the user
export default function ComponentController({ provState } : {provState?: unknown}) {
  // Get the config for the current step
  const studyConfig = useStudyConfig();
  const storage = useStorageEngine();

  const currentStep = useCurrentStep();
  const currentComponent = useCurrentComponent() || 'Notfound';
  const stepConfig = studyConfig.components[currentComponent];

  // If we have a trial, use that config to render the right component else use the step
  const status = useStoredAnswer();

  const currentConfig = isInheritedComponent(stepConfig) && studyConfig.baseComponents ? merge({}, studyConfig.baseComponents?.[stepConfig.baseComponent], stepConfig) as IndividualComponent : stepConfig as IndividualComponent;

  const instruction = (currentConfig.instruction || '');
  const { instructionLocation } = currentConfig;
  const instructionInSideBar = studyConfig.uiConfig.sidebar && (instructionLocation === 'sidebar' || instructionLocation === undefined);

  const [audioStream, setAudioStream] = useState<MediaRecorder | null>(null);
  const dispatch = useStoreDispatch();
  const { setIsRecording, setAnalysisTrialName } = useStoreActions();
  const { analysisTrialName, analysisProvState } = useStoreSelector((state) => state);

  const navigate = useNavigate();

  const [prevTrialName, setPrevTrialName] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setAnalysisTrialName(currentComponent!));
  }, [dispatch, setAnalysisTrialName, currentStep, currentComponent]);

  useEffect(() => {
    if (currentStep && analysisTrialName && currentComponent !== analysisTrialName) {
      navigate(`../${analysisTrialName}`);
    }
  }, [analysisTrialName, currentComponent, currentStep, navigate]);

  useEffect(() => {
    if (!currentStep || !studyConfig || !studyConfig.recordStudyAudio || !storage.storageEngine) {
      return;
    }

    if (audioStream && prevTrialName) {
      storage.storageEngine.saveAudio(audioStream, prevTrialName);
    }

    if (studyConfig.tasksToNotRecordAudio && studyConfig.tasksToNotRecordAudio.includes(currentComponent)) {
      setPrevTrialName(null);
      setAudioStream(null);
      dispatch(setIsRecording(false));
    } else {
      const _stream = navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      _stream.then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        setAudioStream(mediaRecorder);
        dispatch(setIsRecording(true));
      });
      setPrevTrialName(currentComponent);
    }

    // return () => {
    //   if (_stream) {
    //     _stream.then((data) => {
    //       data.getTracks().forEach((track) => track.stop());
    //     });
    //   }
    // };
  }, [currentComponent]);

  // Disable browser back button from all stimuli
  useDisableBrowserBack();

  // Check if we have issues connecting to the database, if so show alert modal
  const { storageEngine } = useStorageEngine();
  const storeDispatch = useStoreDispatch();
  const { setAlertModal } = useStoreActions();
  useEffect(() => {
    if (storageEngine?.getEngine() !== import.meta.env.VITE_STORAGE_ENGINE && import.meta.env.VITE_REVISIT_MODE !== 'public') {
      storeDispatch(setAlertModal({
        show: true,
        message: `There was an issue connecting to the ${import.meta.env.VITE_STORAGE_ENGINE} database. This could be caused by a network issue or your adblocker. If you are using an adblocker, please disable it for this website and refresh.`,
      }));
    }
  }, [setAlertModal, storageEngine, storeDispatch]);

  // We're not using hooks below here, so we can return early if we're at the end of the study.
  // This avoids issues with the component config being undefined for the end of the study.
  if (currentComponent === 'end') {
    return <StudyEnd />;
  }

  if (currentComponent === 'Notfound') {
    return <ResourceNotFound email={studyConfig.uiConfig.contactEmail} />;
  }

  return (
    <>
      {instructionLocation === 'aboveStimulus' && <ReactMarkdownWrapper text={instruction} />}
      <ResponseBlock
        key={`${currentStep}-above-response-block`}
        status={status}
        config={currentConfig}
        location="aboveStimulus"
      />

      <Suspense key={`${currentStep}-stimulus`} fallback={<div>Loading...</div>}>
        {currentConfig.type === 'markdown' && <MarkdownController currentConfig={currentConfig} />}
        {currentConfig.type === 'website' && <IframeController currentConfig={currentConfig} />}
        {currentConfig.type === 'image' && <ImageController currentConfig={currentConfig} />}
        {currentConfig.type === 'react-component' && <ReactComponentController currentConfig={currentConfig} provState={analysisProvState} />}
      </Suspense>

      {(instructionLocation === 'belowStimulus' || (instructionLocation === undefined && !instructionInSideBar)) && <ReactMarkdownWrapper text={instruction} />}
      <ResponseBlock
        key={`${currentStep}-below-response-block`}
        status={status}
        config={currentConfig}
        location="belowStimulus"
      />
    </>
  );
}
