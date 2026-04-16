export type StepId =
  | 'name' | 'age' | 'brings-you-here'
  | 'conditions'
  | 'branch-menopause' | 'branch-complex'
  | 'followup-endo' | 'followup-pcos' | 'followup-poi'
  | 'followup-fibroids' | 'followup-ha' | 'followup-reds' | 'followup-adeno'
  | 'synthesis'

export type BranchPath = 'curious' | 'symptoms' | 'fertility' | 'menopause' | 'complex'

export type AgeRange = 'under-18' | '18-29' | '30-39' | '40-49' | '50+'

export interface ScreenerState {
  name?: string
  ageRange?: AgeRange
  bringsYouHere?: string[]
  branch?: BranchPath
  conditions?: string[]
  suspectedConditions?: string[]
  followups?: Record<string, string | string[] | { symptoms?: string[]; hrt?: string }>
}
