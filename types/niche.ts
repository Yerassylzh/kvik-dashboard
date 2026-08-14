export type NicheProfile =
  | 'REALTY'
  | 'AUTO_SALES'
  | 'AUTO_SERVICE'
  | 'BEAUTY'
  | 'CLINIC'
  | 'OTHER_CALENDAR';

export type OnboardingStepState =
  | 'SELECT_NICHE'
  | 'DATA_SOURCE'
  | 'DATA_PREVIEW'
  | 'CONNECT_CHANNEL'
  | 'QUALIFICATION'
  | 'COMPLETE_TEST'
  | 'DONE';

export interface OnboardingStateResponse {
  step: OnboardingStepState;
  stepIndex?: number;
  completed?: boolean;
}
