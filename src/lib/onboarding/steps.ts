import type { BranchPath, StepId } from './types'

export const BRINGS_YOU_HERE_OPTIONS: { id: string; label: string }[] = [
  { id: 'curious', label: "I'm curious about my health" },
  { id: 'optimise', label: 'I want to optimise my health' },
  { id: 'symptoms', label: 'I have unexplained symptoms' },
  { id: 'diagnosed', label: 'I have a diagnosis' },
  { id: 'fertility', label: "I'm trying to conceive" },
  { id: 'fertility-explore', label: "I'm exploring my fertility" },
  { id: 'menopause', label: "I'm in perimenopause or menopause" },
  { id: 'autoimmune', label: 'I have an autoimmune condition' },
  { id: 'other', label: 'Something else' },
]

export const CONDITIONS_LIST: { id: string; label: string }[] = [
  { id: 'adenomyosis', label: 'Adenomyosis' },
  { id: 'endometriosis', label: 'Endometriosis' },
  { id: 'pcos', label: 'PCOS' },
  { id: 'poi', label: 'POI (Premature Ovarian Insufficiency)' },
  { id: 'fibroids', label: 'Fibroids' },
  { id: 'ha', label: 'Hypothalamic Amenorrhea (HA)' },
  { id: 'reds', label: 'Relative Energy Deficiency in Sport (REDS)' },
  { id: 'no-diagnosis-suspect', label: 'No diagnosis but suspect something' },
  { id: 'no-havent', label: "No I haven't" },
]

export const CONDITION_FOLLOWUPS: Record<string, StepId> = {
  endometriosis: 'followup-endo',
  pcos: 'followup-pcos',
  poi: 'followup-poi',
  fibroids: 'followup-fibroids',
  ha: 'followup-ha',
  reds: 'followup-reds',
  adenomyosis: 'followup-adeno',
}

const FERTILITY_FAMILY = ['fertility', 'fertility-explore']
const SYMPTOMS_FAMILY = ['symptoms', 'diagnosed']

export function detectBranch(selections: string[]): BranchPath {
  const hasFertility = selections.some((s) => FERTILITY_FAMILY.includes(s))
  const hasMenopause = selections.includes('menopause')
  const hasSymptoms = selections.some((s) => SYMPTOMS_FAMILY.includes(s))

  if (hasFertility && hasMenopause) return 'complex'
  if (hasFertility) return 'fertility'
  if (hasMenopause) return 'menopause'
  if (hasSymptoms) return 'symptoms'
  return 'curious'
}

export function buildStepQueue(branch: BranchPath, selectedConditions: string[]): StepId[] {
  const queue: StepId[] = []

  switch (branch) {
    case 'curious':
      // No conditions step
      break
    case 'symptoms':
    case 'fertility':
      queue.push('conditions')
      break
    case 'menopause':
      queue.push('branch-menopause')
      break
    case 'complex':
      queue.push('branch-complex', 'conditions')
      break
  }

  // Append follow-up steps for selected conditions
  for (const condition of selectedConditions) {
    const followupStep = CONDITION_FOLLOWUPS[condition]
    if (followupStep) {
      queue.push(followupStep)
    }
  }

  queue.push('synthesis')
  return queue
}

export function toggleCondition(id: string, current: string[]): string[] {
  if (id === 'no-havent') {
    return ['no-havent']
  }

  // Remove 'no-havent' from current
  const filtered = current.filter((c) => c !== 'no-havent')

  // Toggle the selected id
  if (filtered.includes(id)) {
    return filtered.filter((c) => c !== id)
  }
  return [...filtered, id]
}
