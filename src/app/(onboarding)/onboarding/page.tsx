'use client'

import { useState, useEffect } from 'react'
import type { ScreenerState, StepId, AgeRange } from '@/lib/onboarding/types'
import {
  detectBranch,
  buildStepQueue,
  toggleCondition,
  BRINGS_YOU_HERE_OPTIONS,
  CONDITIONS_LIST,
} from '@/lib/onboarding/steps'
import { synthesiseInvestigation } from '@/lib/onboarding/actions'

function useTypewriter(text: string | null, delay = 40) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!text) return
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(id)
    }, delay)
    return () => clearInterval(id)
  }, [text, delay])
  return displayed
}

const AGE_OPTIONS: { id: AgeRange; label: string }[] = [
  { id: 'under-18', label: 'Under 18' },
  { id: '18-29', label: '18–29' },
  { id: '30-39', label: '30–39' },
  { id: '40-49', label: '40–49' },
  { id: '50+', label: '50+' },
]

const MENOPAUSE_SYMPTOMS = [
  { id: 'hot-flushes', label: 'Hot flushes' },
  { id: 'brain-fog', label: 'Brain fog' },
  { id: 'sleep', label: 'Sleep disruption' },
  { id: 'mood', label: 'Mood changes' },
  { id: 'joint-pain', label: 'Joint pain' },
  { id: 'weight', label: 'Weight changes' },
]

const HRT_OPTIONS = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'considering', label: 'Considering it' },
]

const FOLLOWUP_STEPS: Record<string, { question: string; options: { id: string; label: string }[] }> = {
  'followup-endo': {
    question: 'What stage has your endometriosis been confirmed?',
    options: [
      { id: 'stage-1', label: 'Stage I' },
      { id: 'stage-2', label: 'Stage II' },
      { id: 'stage-3', label: 'Stage III' },
      { id: 'stage-4', label: 'Stage IV' },
      { id: 'not-staged', label: 'Not staged' },
      { id: 'suspected', label: 'Suspected but unconfirmed' },
    ],
  },
  'followup-pcos': {
    question: 'How was your PCOS diagnosed?',
    options: [
      { id: 'rotterdam', label: 'Rotterdam criteria' },
      { id: 'ultrasound', label: 'Ultrasound only' },
      { id: 'clinical', label: 'Clinical (symptoms)' },
      { id: 'unconfirmed', label: 'Not formally confirmed' },
    ],
  },
  'followup-poi': {
    question: 'How old were you when you were diagnosed with POI?',
    options: [
      { id: 'under-20', label: 'Under 20' },
      { id: '20-25', label: '20–25' },
      { id: '26-30', label: '26–30' },
      { id: '31-40', label: '31–40' },
      { id: 'over-40', label: 'Over 40' },
    ],
  },
  'followup-fibroids': {
    question: 'Where are your fibroids located?',
    options: [
      { id: 'submucosal', label: 'Submucosal' },
      { id: 'intramural', label: 'Intramural' },
      { id: 'subserosal', label: 'Subserosal' },
      { id: 'multiple', label: 'Multiple' },
      { id: 'dont-know', label: "Don't know" },
    ],
  },
  'followup-ha': {
    question: 'Has your period returned?',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No, still absent' },
      { id: 'partial', label: 'Partially returned' },
    ],
  },
  'followup-reds': {
    question: 'Are you working with a specialist?',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'starting', label: 'Just starting to' },
    ],
  },
  'followup-adeno': {
    question: 'How was your adenomyosis diagnosed?',
    options: [
      { id: 'mri', label: 'MRI' },
      { id: 'ultrasound', label: 'Ultrasound' },
      { id: 'histology', label: 'Histology (after surgery)' },
      { id: 'clinical', label: 'Clinical diagnosis' },
    ],
  },
}

const FOLLOWUP_CONDITION_KEY: Record<string, string> = {
  'followup-endo': 'endometriosis',
  'followup-pcos': 'pcos',
  'followup-poi': 'poi',
  'followup-fibroids': 'fibroids',
  'followup-ha': 'ha',
  'followup-reds': 'reds',
  'followup-adeno': 'adenomyosis',
}

export default function OnboardingPage() {
  const [stepQueue, setStepQueue] = useState<StepId[]>(['name', 'age', 'brings-you-here'])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<ScreenerState>({})

  // Local multi-select state for multi-select steps
  const [multiSelected, setMultiSelected] = useState<string[]>([])
  // Local text input state for name step
  const [nameInput, setNameInput] = useState('')
  // Menopause sub-step: 0 = symptoms, 1 = hrt
  const [menopauseSubStep, setMenopauseSubStep] = useState(0)
  const [menopauseSymptoms, setMenopauseSymptoms] = useState<string[]>([])

  // Synthesis step state
  const [synthesisState, setSynthesisState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [investigationTitle, setInvestigationTitle] = useState<string | null>(null)
  const displayedTitle = useTypewriter(investigationTitle, 40)

  const currentStep = stepQueue[idx]

  // Trigger synthesis when synthesis step is reached
  useEffect(() => {
    if (stepQueue[idx] !== 'synthesis' || synthesisState !== 'idle') return
    setSynthesisState('loading')
    synthesiseInvestigation(answers)
      .then(({ title }) => {
        setInvestigationTitle(title)
        setSynthesisState('done')
      })
      .catch(() => {
        // On error show a fallback title — don't block the user
        setInvestigationTitle('My health investigation')
        setSynthesisState('done')
      })
  }, [idx, stepQueue, synthesisState, answers])

  function advance(partial: Partial<ScreenerState>) {
    const merged = { ...answers, ...partial }
    setAnswers(merged)
    setMultiSelected([])

    let newQueue = [...stepQueue]

    if (currentStep === 'brings-you-here') {
      const branch = detectBranch(partial.bringsYouHere ?? [])
      const remaining = buildStepQueue(branch, [])
      newQueue = ['name', 'age', 'brings-you-here', ...remaining]
      setStepQueue(newQueue)
    } else if (currentStep === 'conditions') {
      const branch = merged.branch!
      const conditions = partial.conditions ?? []
      // buildStepQueue returns ['conditions', ...followups, 'synthesis'] for fertility/symptoms
      // We're already at 'conditions' so skip it — take only the tail (followups + synthesis)
      const fullQueue = buildStepQueue(branch, conditions)
      const conditionsIdx = fullQueue.indexOf('conditions')
      const remaining = conditionsIdx >= 0 ? fullQueue.slice(conditionsIdx + 1) : fullQueue
      newQueue = [...stepQueue.slice(0, idx + 1), ...remaining]
      setStepQueue(newQueue)
    }

    setIdx((i) => i + 1)
  }

  function back() {
    setMultiSelected([])
    setMenopauseSubStep(0)
    setMenopauseSymptoms([])
    setIdx((i) => Math.max(0, i - 1))
  }

  const totalSteps = stepQueue.length
  const showBack = idx > 0

  // Step dots
  const stepDots = (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: i === idx ? '#d4f547' : 'rgba(255,255,255,0.25)',
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )

  // Back button
  const backButton = showBack ? (
    <button
      className="onboard__hint"
      onClick={back}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '24px',
        padding: 0,
        alignSelf: 'flex-start',
      }}
    >
      ← Back
    </button>
  ) : null

  function renderStep() {
    switch (currentStep) {
      case 'name':
        return (
          <div style={{ width: '100%' }}>
            <p className="onboard__question" style={{ marginBottom: '8px' }}>
              {"What's your name?"}
            </p>
            <p className="onboard__hint" style={{ marginBottom: '24px' }}>
              {"We'll use this throughout your investigation."}
            </p>
            <input
              className="input-field input-field--dark"
              type="text"
              required
              minLength={2}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim().length >= 2) {
                  advance({ name: nameInput.trim() })
                  setNameInput('')
                }
              }}
              placeholder="Your name"
              style={{ width: '100%', marginBottom: '16px' }}
            />
            {nameInput.trim().length >= 2 && (
              <button
                className="btn btn--primary btn--full"
                onClick={() => {
                  advance({ name: nameInput.trim() })
                  setNameInput('')
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'age':
        return (
          <div style={{ width: '100%' }}>
            <p className="onboard__question" style={{ marginBottom: '24px' }}>
              How old are you?
            </p>
            <ul className="option-list">
              {AGE_OPTIONS.map((opt) => (
                <li
                  key={opt.id}
                  className="option-item"
                  onClick={() => advance({ ageRange: opt.id })}
                >
                  <span className="option-item__check" />
                  <span className="option-item__label">{opt.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )

      case 'brings-you-here':
        return (
          <div style={{ width: '100%' }}>
            <p className="onboard__question" style={{ marginBottom: '24px' }}>
              So, what brings you here?
            </p>
            <ul className="option-list">
              {BRINGS_YOU_HERE_OPTIONS.map((opt) => (
                <li
                  key={opt.id}
                  className={`option-item${multiSelected.includes(opt.id) ? ' selected' : ''}`}
                  onClick={() => {
                    setMultiSelected((prev) =>
                      prev.includes(opt.id)
                        ? prev.filter((s) => s !== opt.id)
                        : [...prev, opt.id]
                    )
                  }}
                >
                  <span className="option-item__check" />
                  <span className="option-item__label">{opt.label}</span>
                </li>
              ))}
            </ul>
            {multiSelected.length > 0 && (
              <button
                className="btn btn--primary btn--full"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  const branch = detectBranch(multiSelected)
                  advance({ bringsYouHere: multiSelected, branch })
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'conditions':
        return (
          <div style={{ width: '100%' }}>
            <p className="onboard__question" style={{ marginBottom: '24px' }}>
              Have you been diagnosed with any of these conditions?
            </p>
            <ul className="option-list">
              {CONDITIONS_LIST.map((opt) => {
                const isDivider = opt.id === 'no-havent'
                return (
                  <>
                    {isDivider && (
                      <li
                        key="divider"
                        className="divider"
                        style={{
                          height: '1px',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                          margin: '8px 0',
                          listStyle: 'none',
                        }}
                      />
                    )}
                    <li
                      key={opt.id}
                      className={`option-item${multiSelected.includes(opt.id) ? ' selected' : ''}`}
                      onClick={() => {
                        setMultiSelected(toggleCondition(opt.id, multiSelected))
                      }}
                    >
                      <span className="option-item__check" />
                      <span className="option-item__label">{opt.label}</span>
                    </li>
                  </>
                )
              })}
            </ul>
            {multiSelected.length > 0 && (
              <button
                className="btn btn--primary btn--full"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  const conditions = multiSelected.filter(
                    (s) => s !== 'no-diagnosis-suspect' && s !== 'no-havent'
                  )
                  const suspected = multiSelected.includes('no-diagnosis-suspect')
                    ? ['no-diagnosis-suspect']
                    : []
                  advance({ conditions, suspectedConditions: suspected })
                }}
              >
                Continue
              </button>
            )}
          </div>
        )

      case 'branch-menopause':
      case 'branch-complex': {
        const branchQuestion =
          currentStep === 'branch-complex'
            ? 'Tell me about the menopause side of things.'
            : "What's your experience like?"

        if (menopauseSubStep === 0) {
          return (
            <div style={{ width: '100%' }}>
              <p className="onboard__question" style={{ marginBottom: '24px' }}>
                {branchQuestion}
              </p>
              <ul className="option-list">
                {MENOPAUSE_SYMPTOMS.map((opt) => (
                  <li
                    key={opt.id}
                    className={`option-item${menopauseSymptoms.includes(opt.id) ? ' selected' : ''}`}
                    onClick={() => {
                      setMenopauseSymptoms((prev) =>
                        prev.includes(opt.id)
                          ? prev.filter((s) => s !== opt.id)
                          : [...prev, opt.id]
                      )
                    }}
                  >
                    <span className="option-item__check" />
                    <span className="option-item__label">{opt.label}</span>
                  </li>
                ))}
              </ul>
              {menopauseSymptoms.length > 0 && (
                <button
                  className="btn btn--primary btn--full"
                  style={{ marginTop: '16px' }}
                  onClick={() => setMenopauseSubStep(1)}
                >
                  Continue
                </button>
              )}
            </div>
          )
        }

        // Sub-step 1: HRT status (single-select, auto-advance)
        return (
          <div style={{ width: '100%' }}>
            <p className="onboard__question" style={{ marginBottom: '24px' }}>
              Are you on HRT?
            </p>
            <ul className="option-list">
              {HRT_OPTIONS.map((opt) => (
                <li
                  key={opt.id}
                  className="option-item"
                  onClick={() => {
                    advance({
                      followups: {
                        ...answers.followups,
                        menopause: { symptoms: menopauseSymptoms, hrt: opt.id },
                      },
                    })
                    setMenopauseSubStep(0)
                    setMenopauseSymptoms([])
                  }}
                >
                  <span className="option-item__check" />
                  <span className="option-item__label">{opt.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      }

      default: {
        // Follow-up steps
        const followupDef = FOLLOWUP_STEPS[currentStep]
        if (followupDef) {
          const conditionKey = FOLLOWUP_CONDITION_KEY[currentStep]
          return (
            <div style={{ width: '100%' }}>
              <p className="onboard__question" style={{ marginBottom: '24px' }}>
                {followupDef.question}
              </p>
              <ul className="option-list">
                {followupDef.options.map((opt) => (
                  <li
                    key={opt.id}
                    className="option-item"
                    onClick={() => {
                      advance({
                        followups: { ...answers.followups, [conditionKey]: opt.id },
                      })
                    }}
                  >
                    <span className="option-item__check" />
                    <span className="option-item__label">{opt.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        // synthesis step
        if (currentStep === 'synthesis') {
          const synthesisStyle = (
            <style>{`
              .loading-dots {
                animation: blink 1.2s step-start infinite;
              }
              @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
            `}</style>
          )

          if (synthesisState === 'loading' || synthesisState === 'idle') {
            return (
              <div style={{ width: '100%', textAlign: 'center' }}>
                {synthesisStyle}
                <p className="onboard__question" aria-live="polite">
                  Agatha is thinking
                  <span className="loading-dots" aria-hidden="true">...</span>
                </p>
              </div>
            )
          }

          // synthesisState === 'done'
          return (
            <div style={{ width: '100%', textAlign: 'center' }}>
              {synthesisStyle}
              <p className="onboard__hint" style={{ marginBottom: '8px' }}>Your investigation</p>
              <h1 className="onboard__question" style={{ marginBottom: '24px' }}>{displayedTitle}</h1>
              <p className="onboard__hint" style={{ marginBottom: '32px' }}>
                Your investigation has been created. Everything you log, track, and discover will live here.
              </p>
              {displayedTitle.length === investigationTitle?.length && (
                <button
                  className="btn btn--primary btn--full"
                  onClick={() => { window.location.href = '/' }}
                >
                  Begin my investigation
                </button>
              )}
            </div>
          )
        }

        return null
      }
    }
  }

  return (
    <div
      className="onboard"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px 32px',
      }}
    >
      {stepDots}
      {backButton}
      {renderStep()}
    </div>
  )
}

function SynthesisEllipsis() {
  return (
    <span
      style={{
        display: 'inline-block',
        animation: 'ellipsis-pulse 1.5s steps(4, end) infinite',
      }}
    >
      <style>{`
        @keyframes ellipsis-pulse {
          0%   { content: '.'; }
          25%  { content: '..'; }
          50%  { content: '...'; }
          75%  { content: ''; }
        }
      `}</style>
      ...
    </span>
  )
}
