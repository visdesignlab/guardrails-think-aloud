import { Suspense, useCallback } from 'react';
import { ModuleNamespace } from 'vite/types/hot';
import { ReactComponent } from '../parser/types';
import { StimulusParams } from '../store/types';
import { useStoreDispatch, useStoreActions, useFlatSequence } from '../store/store';
import { useCurrentStep } from '../routes/utils';

const modules = import.meta.glob(
  '../public/**/*.{mjs,js,mts,ts,jsx,tsx}',
  { eager: true },
);

function ReactComponentController({ currentConfig, provState }: { currentConfig: ReactComponent; provState?: unknown; }) {
  const currentStep = useCurrentStep();
  const currentComponent = useFlatSequence()[currentStep];

  const reactPath = `../public/${currentConfig.path}`;

  const StimulusComponent = (modules[reactPath] as ModuleNamespace).default;

  const storeDispatch = useStoreDispatch();
  const { updateResponseBlockValidation, setIframeAnswers } = useStoreActions();

  const setAnswer = useCallback(({ status, provenanceGraph, answers }: Parameters<StimulusParams<unknown, unknown>['setAnswer']>[0]) => {
    storeDispatch(updateResponseBlockValidation({
      location: 'sidebar',
      identifier: `${currentComponent}_${currentStep}`,
      status,
      values: answers,
      provenanceGraph,
    }));

    storeDispatch(setIframeAnswers(answers));
  }, [storeDispatch, updateResponseBlockValidation, currentComponent, currentStep, setIframeAnswers]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StimulusComponent
        parameters={currentConfig.parameters}
        // eslint-disable-next-line react/jsx-no-bind
        setAnswer={setAnswer}
        provenanceState={provState}
      />
    </Suspense>
  );
}

export default ReactComponentController;
