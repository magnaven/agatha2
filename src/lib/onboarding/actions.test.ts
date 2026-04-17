import { synthesiseInvestigation } from './actions'

// Mock @anthropic-ai/sdk
let mockCreate: jest.Mock

jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn()
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create },
    })),
    __mockCreate: create,
  }
})

// Mock supabase client — use a factory that returns fresh mocks each call
let mockGetUser: jest.Mock
let mockUpsert: jest.Mock
let mockInsert: jest.Mock
let mockSelect: jest.Mock
let mockSingle: jest.Mock
let mockFrom: jest.Mock

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

function setupSupabaseMocks() {
  mockGetUser = jest.fn().mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })
  mockUpsert = jest.fn().mockResolvedValue({ error: null })
  mockSingle = jest.fn().mockResolvedValue({
    data: { id: 'inv-456' },
    error: null,
  })
  mockSelect = jest.fn().mockReturnValue({ single: mockSingle })
  mockInsert = jest.fn().mockResolvedValue({ error: null })

  mockFrom = jest.fn().mockImplementation((table: string) => {
    if (table === 'profiles') return { upsert: mockUpsert }
    if (table === 'investigations') {
      const invInsert = jest.fn().mockReturnValue({ select: mockSelect })
      return { insert: invInsert }
    }
    if (table === 'journal_entries') return { insert: mockInsert }
    return {}
  })

  const { createClient } = require('@/lib/supabase/server')
  ;(createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })
}

describe('synthesiseInvestigation', () => {
  beforeAll(() => {
    const sdk = require('@anthropic-ai/sdk')
    mockCreate = sdk.__mockCreate
  })

  beforeEach(() => {
    jest.clearAllMocks()
    setupSupabaseMocks()

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'My endometriosis investigation journey' }],
    })
  })

  it('returns { title } on success', async () => {
    const result = await synthesiseInvestigation({
      name: 'Alice',
      ageRange: '30-39',
      conditions: ['endometriosis'],
      suspectedConditions: [],
      bringsYouHere: ['fertility'],
    })
    expect(result).toEqual({ title: 'My endometriosis investigation journey' })
  })

  it('throws "Not authenticated" when getUser returns error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('session expired'),
    })
    await expect(
      synthesiseInvestigation({ name: 'Alice' })
    ).rejects.toThrow('Not authenticated')
  })

  it('throws "Not authenticated" when user is null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })
    await expect(
      synthesiseInvestigation({ name: 'Alice' })
    ).rejects.toThrow('Not authenticated')
  })

  it('calls profiles upsert with correct fields (name, conditions, and onboarding_complete)', async () => {
    await synthesiseInvestigation({
      name: 'Alice',
      ageRange: '30-39',
      conditions: ['endometriosis', 'pcos'],
      suspectedConditions: ['fibroids'],
      bringsYouHere: ['fertility'],
    })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        name: 'Alice',
        conditions: ['endometriosis', 'pcos'],
        onboarding_complete: true,
      })
    )
  })

  it('calls investigations insert with status: "active"', async () => {
    const invInsertMock = jest.fn().mockReturnValue({ select: mockSelect })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') return { upsert: mockUpsert }
      if (table === 'investigations') return { insert: invInsertMock }
      if (table === 'journal_entries') return { insert: mockInsert }
      return {}
    })

    await synthesiseInvestigation({
      name: 'Alice',
      conditions: ['endometriosis'],
    })

    expect(invInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    )
  })

  it('calls journal_entries insert with entry_type="milestone" and day_number=1', async () => {
    await synthesiseInvestigation({
      name: 'Alice',
      conditions: ['endometriosis'],
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entry_type: 'milestone',
        day_number: 1,
      })
    )
  })
})
