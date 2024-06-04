import { EditedText } from '../../components/interface/audioAnalysis/types';
import { StudyConfig } from '../../parser/types';
import { StoredAnswer } from '../../store/types';
import { ParticipantData } from '../types';

export abstract class StorageEngine {
  protected engine: string;

  protected connected = false;

  protected currentParticipantId: string | null = null;

  constructor(engine: string) {
    this.engine = engine;
  }

  isConnected() {
    return this.connected;
  }

  getEngine() {
    return this.engine;
  }

  abstract connect(): Promise<void>;

  abstract initializeStudyDb(studyId: string, config: StudyConfig): Promise<void>;

  abstract initializeParticipantSession(searchParams: Record<string, string>, config: StudyConfig, urlParticipantId?: string): Promise<ParticipantData>;

  abstract getCurrentParticipantId(urlParticipantId?: string): Promise<string>;

  abstract clearCurrentParticipantId(): Promise<void>;

  abstract saveAnswer(currentStep: string, answer: StoredAnswer): Promise<void>;

  abstract saveEditedTranscript(participantId: string, transcript: EditedText[]): Promise<void>;

  abstract getEditedTranscript(participantId: string): Promise<EditedText[]>;

  abstract setSequenceArray(latinSquare: string[][]): Promise<void>;

  abstract getSequenceArray(participantId?: string): Promise<string[][] | null>;

  abstract getSequence(participantId?: string): Promise<string[]>;

  abstract getAllParticipantsData(): Promise<ParticipantData[]>;

  abstract getParticipantData(participantId?: string): Promise<ParticipantData | null>;

  abstract getAudio(taskList: string[], participantId?: string): Promise<string[]>;

  abstract getTranscription(taskList: string[], participantId?: string): Promise<string[]>;

  abstract nextParticipant(config: StudyConfig): Promise<ParticipantData>;

  abstract saveAudio(audioStream: MediaRecorder, taskName: string): Promise<void>;

  abstract verifyCompletion(answers: Record<string, StoredAnswer>): Promise<boolean>;
}
