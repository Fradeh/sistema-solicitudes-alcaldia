export class ChecklistStepDto {
  stepName!: string;
  isCompleted?: boolean;
  updatedBy!: string;
  observation?: string;
}

export class CreateAcademicChecklistDto {
  requestId!: string;
  steps!: ChecklistStepDto[];
  generalObservation?: string;
}