import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CampaignSelector from './CampaignSelector'
import * as actions from '@/app/actions'

// Mock the server action
vi.mock('@/app/actions', () => ({
  activateCampaign: vi.fn(),
}))

describe('CampaignSelector', () => {
  const campaigns = [
    { id: '1', name: 'Campaign 1' },
    { id: '2', name: 'Campaign 2' },
  ]
  const activeId = '1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all campaigns', () => {
    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    expect(screen.getByText('Campaign 1')).toBeInTheDocument()
    expect(screen.getByText('Campaign 2')).toBeInTheDocument()
  })

  it('shows the active campaign as selected', () => {
    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('1')
  })

  it('calls activateCampaign when a different campaign is selected', async () => {
    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    const select = screen.getByRole('combobox')
    
    fireEvent.change(select, { target: { value: '2' } })

    await waitFor(() => {
      expect(actions.activateCampaign).toHaveBeenCalledWith('2')
    })
  })

  it('does not call activateCampaign when the same campaign is selected', async () => {
    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    const select = screen.getByRole('combobox')
    
    fireEvent.change(select, { target: { value: '1' } })

    await waitFor(() => {
      expect(actions.activateCampaign).not.toHaveBeenCalled()
    })
  })

  it('disables the select while activation is pending', async () => {
    vi.mocked(actions.activateCampaign).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    const select = screen.getByRole('combobox')
    
    fireEvent.change(select, { target: { value: '2' } })

    expect(select).toBeDisabled()

    await waitFor(() => {
      expect(select).not.toBeDisabled()
    })
  })

  it('shows create campaign form when plus button is clicked', () => {
    render(<CampaignSelector campaigns={campaigns} activeId={activeId} />)
    const plusBtn = screen.getByTitle('New Campaign')
    
    fireEvent.click(plusBtn)

    expect(screen.getByPlaceholderText('Campaign Name')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
  })
})
