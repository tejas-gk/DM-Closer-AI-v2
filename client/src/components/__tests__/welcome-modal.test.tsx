import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeModal from '../welcome-modal';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Instagram: () => <div data-testid="instagram-icon" />,
  Link: () => <div data-testid="link-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

describe('WelcomeModal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('should render when isOpen is true', () => {
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Welcome to DMCloser AI!')).toBeInTheDocument();
      expect(screen.getByText('Your subscription is now active. Let\'s get you set up for success.')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<WelcomeModal isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Welcome to DMCloser AI!')).not.toBeInTheDocument();
    });

    it('should display correct step indicators', () => {
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      const stepIndicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full')
      );
      expect(stepIndicators).toHaveLength(3);
    });
  });

  describe('Step Navigation', () => {
    it('should start at step 1 (Welcome)', () => {
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Welcome to DMCloser AI!')).toBeInTheDocument();
      expect(screen.getByText('You\'re now ready to automate your Instagram DMs with AI that sounds just like you.')).toBeInTheDocument();
    });

    it('should navigate to step 2 when Next is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      expect(screen.getByText('Quick Setup Guide')).toBeInTheDocument();
      expect(screen.getByText('Configure AI Settings')).toBeInTheDocument();
    });

    it('should navigate to step 3 when Next is clicked twice', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      await user.click(nextButton);
      
      expect(screen.getByText('Connect Your Instagram')).toBeInTheDocument();
      expect(screen.getByText('Almost There!')).toBeInTheDocument();
    });

    it('should show Previous button on step 2 and beyond', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Should not show Previous on step 1
      expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
      
      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should show Previous on step 2
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    it('should navigate back when Previous is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Navigate back to step 1
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);
      
      expect(screen.getByText('Welcome to DMCloser AI!')).toBeInTheDocument();
    });
  });

  describe('Instagram Connection', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Navigate to step 3 (Instagram connection)
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      await user.click(nextButton);
    });

    it('should show Instagram connection button initially', () => {
      expect(screen.getByRole('button', { name: /connect instagram account/i })).toBeInTheDocument();
      expect(screen.getByText('Secure Connection')).toBeInTheDocument();
    });

    it('should show loading state when connecting', async () => {
      const user = userEvent.setup();
      
      const connectButton = screen.getByRole('button', { name: /connect instagram account/i });
      await user.click(connectButton);
      
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(connectButton).toBeDisabled();
    });

    it('should show success state after connection', async () => {
      const user = userEvent.setup();
      
      const connectButton = screen.getByRole('button', { name: /connect instagram account/i });
      await user.click(connectButton);
      
      // Wait for the simulated connection to complete
      await waitFor(() => {
        expect(screen.getByText('Connected Successfully!')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByText('@your_instagram_account')).toBeInTheDocument();
    });

    it('should change final button text based on connection status', async () => {
      const user = userEvent.setup();
      
      // Initially should show "Go to Dashboard"
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
      
      // Connect Instagram
      const connectButton = screen.getByRole('button', { name: /connect instagram account/i });
      await user.click(connectButton);
      
      // After connection should show "Complete Setup"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete setup/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Modal Closing', () => {
    it('should call onClose when final button is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Navigate to final step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      await user.click(nextButton);
      
      // Click final button
      const finalButton = screen.getByRole('button', { name: /go to dashboard/i });
      await user.click(finalButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Skip for Now is clicked', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Navigate to final step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      await user.click(nextButton);
      
      // Click Skip for Now
      const skipButton = screen.getByRole('button', { name: /skip for now/i });
      await user.click(skipButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-responsive elements', () => {
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Check for responsive classes (this is a basic test, in reality you'd test actual responsiveness)
      const content = screen.getByText('Welcome to DMCloser AI!').closest('div');
      expect(content?.className).toContain('sm:');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Welcome to DMCloser AI!')).toBeInTheDocument();
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(<WelcomeModal isOpen={true} onClose={mockOnClose} />);
      
      // Tab navigation should work
      await user.tab();
      expect(screen.getByRole('button', { name: /next/i })).toHaveFocus();
    });
  });
});