export interface TranscribedAudioSnippet {
    alternatives: {confidence: number, transcript: string}[]
    languageCode: string;
    resultEndTime: string | number;
}

export interface TranscribedAudio {
    results: TranscribedAudioSnippet[]
}

export interface Tag {
    color: string,
    name: string
}
