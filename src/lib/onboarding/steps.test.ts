import {
  detectBranch,
  buildStepQueue,
  toggleCondition,
} from './steps'

describe('detectBranch', () => {
  it('returns fertility for fertility selection', () => {
    expect(detectBranch(['fertility'])).toBe('fertility')
  })

  it('returns menopause for menopause selection', () => {
    expect(detectBranch(['menopause'])).toBe('menopause')
  })

  it('returns complex for both fertility and menopause', () => {
    expect(detectBranch(['fertility', 'menopause'])).toBe('complex')
  })

  it('returns symptoms for symptoms + curious mix', () => {
    expect(detectBranch(['symptoms', 'curious'])).toBe('symptoms')
  })

  it('returns curious for only curious selections', () => {
    expect(detectBranch(['curious'])).toBe('curious')
  })
})

describe('buildStepQueue', () => {
  it('returns [synthesis] for curious branch with no conditions', () => {
    expect(buildStepQueue('curious', [])).toEqual(['synthesis'])
  })

  it('returns [conditions, synthesis] for symptoms branch', () => {
    expect(buildStepQueue('symptoms', [])).toEqual(['conditions', 'synthesis'])
  })

  it('returns [conditions, synthesis] for fertility branch', () => {
    expect(buildStepQueue('fertility', [])).toEqual(['conditions', 'synthesis'])
  })

  it('returns [conditions, followup-endo, synthesis] for fertility + endometriosis', () => {
    expect(buildStepQueue('fertility', ['endometriosis'])).toEqual([
      'conditions',
      'followup-endo',
      'synthesis',
    ])
  })

  it('returns [conditions, followup-endo, followup-pcos, synthesis] for fertility + endo + pcos', () => {
    expect(buildStepQueue('fertility', ['endometriosis', 'pcos'])).toEqual([
      'conditions',
      'followup-endo',
      'followup-pcos',
      'synthesis',
    ])
  })

  it('returns [branch-menopause, synthesis] for menopause branch', () => {
    expect(buildStepQueue('menopause', [])).toEqual(['branch-menopause', 'synthesis'])
  })

  it('returns [branch-complex, conditions, followup-pcos, synthesis] for complex + pcos', () => {
    expect(buildStepQueue('complex', ['pcos'])).toEqual([
      'branch-complex',
      'conditions',
      'followup-pcos',
      'synthesis',
    ])
  })
})

describe('toggleCondition', () => {
  it('returns [no-havent] exclusively when selecting no-havent', () => {
    expect(toggleCondition('no-havent', ['endometriosis'])).toEqual(['no-havent'])
  })

  it('clears no-havent when selecting a condition', () => {
    expect(toggleCondition('endometriosis', ['no-havent'])).toEqual(['endometriosis'])
  })

  it('stacks no-diagnosis-suspect with conditions', () => {
    expect(toggleCondition('no-diagnosis-suspect', ['endometriosis'])).toEqual([
      'endometriosis',
      'no-diagnosis-suspect',
    ])
  })

  it('deselects a condition when clicking it again', () => {
    expect(toggleCondition('endometriosis', ['endometriosis'])).toEqual([])
  })
})
