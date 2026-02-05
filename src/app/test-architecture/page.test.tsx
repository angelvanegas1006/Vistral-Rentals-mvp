import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestArchitecturePage from './page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the components to isolate the page logic
jest.mock('@/components/kanban/KanbanCard', () => ({
  KanbanCard: ({ property, onClick }: { property: any; onClick: () => void }) => (
    <div data-testid="kanban-card" onClick={onClick}>
      <div data-testid="property-id">{property.property_unique_id}</div>
      <div data-testid="property-address">{property.address}</div>
      <div data-testid="property-city">{property.city}</div>
      <div data-testid="property-phase">{property.currentPhase}</div>
    </div>
  ),
}));

describe('TestArchitecturePage', () => {
  const mockProperty = {
    property_unique_id: 'PROP-2024-001',
    address: 'Calle Gran Vía, 123',
    city: 'Madrid',
    daysInPhase: 3,
    currentPhase: 'Phase 0: Component Test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title and description', () => {
    render(<TestArchitecturePage />);

    expect(
      screen.getByText('Architecture Proof of Concept')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Click the card below to navigate to the full-page property view')
    ).toBeInTheDocument();
  });

  it('renders the KanbanCard with correct property data', () => {
    render(<TestArchitecturePage />);

    const kanbanCard = screen.getByTestId('kanban-card');
    expect(kanbanCard).toBeInTheDocument();
    expect(screen.getByTestId('property-id')).toHaveTextContent(
      mockProperty.property_unique_id
    );
    expect(screen.getByTestId('property-address')).toHaveTextContent(
      mockProperty.address
    );
    expect(screen.getByTestId('property-city')).toHaveTextContent(
      mockProperty.city
    );
    expect(screen.getByTestId('property-phase')).toHaveTextContent(
      mockProperty.currentPhase
    );
  });

  it('navigates to property page when KanbanCard is clicked', async () => {
    const user = userEvent.setup();
    render(<TestArchitecturePage />);

    const kanbanCard = screen.getByTestId('kanban-card');
    await user.click(kanbanCard);

    expect(mockPush).toHaveBeenCalledWith(
      `/test-architecture/property/${mockProperty.property_unique_id}`
    );
  });

  it('passes the correct property data to KanbanCard', () => {
    render(<TestArchitecturePage />);

    // Verify KanbanCard receives correct props
    expect(screen.getByTestId('property-id')).toHaveTextContent(
      mockProperty.property_unique_id
    );
    expect(screen.getByTestId('property-address')).toHaveTextContent(
      mockProperty.address
    );
    expect(screen.getByTestId('property-city')).toHaveTextContent(
      mockProperty.city
    );
    expect(screen.getByTestId('property-phase')).toHaveTextContent(
      mockProperty.currentPhase
    );
  });
});
