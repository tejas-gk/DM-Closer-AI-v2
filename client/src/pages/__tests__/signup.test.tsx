import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Signup from '../signup';
import { signupUser } from '../../lib/supabase/auth';

// Mock authentication service
jest.mock('../../lib/supabase/auth', () => ({
  signupUser: jest.fn()
}));

// Mock wouter for routing
jest.mock('wouter', () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  useLocation: () => ['/signup', jest.fn()]
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock logo asset
jest.mock('@assets/image_1750404810112.png', () => 'mock-logo.png');

const mockSignupUser = signupUser as jest.MockedFunction<typeof signupUser>;

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render signup form with all required fields', () => {
    renderWithProviders(<Signup />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should validate all required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('should handle successful signup', async () => {
    const user = userEvent.setup();
    const mockSuccessResponse = {
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'John',
            last_name: 'Doe'
          }
        },
        session: null
      },
      error: null
    };

    mockSignupUser.mockResolvedValue(mockSuccessResponse);
    renderWithProviders(<Signup />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignupUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          first_name: 'John',
          last_name: 'Doe'
        }
      );
    });
  });

  it('should handle signup errors', async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      data: { user: null, session: null },
      error: { message: 'Email already registered' }
    };

    mockSignupUser.mockResolvedValue(mockErrorResponse);
    renderWithProviders(<Signup />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignupUser).toHaveBeenCalled();
    });
  });

  it('should toggle password visibility for both password fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const passwordToggle = screen.getAllByRole('button', { name: /toggle password visibility/i })[0];
    const confirmPasswordToggle = screen.getAllByRole('button', { name: /toggle password visibility/i })[1];

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    await user.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(confirmPasswordToggle);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should show loading state during signup', async () => {
    const user = userEvent.setup();
    let resolveSignup: (value: any) => void;
    const signupPromise = new Promise(resolve => {
      resolveSignup = resolve;
    });

    mockSignupUser.mockReturnValue(signupPromise);
    renderWithProviders(<Signup />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolveSignup!({
      data: { user: { id: 'user-123' }, session: null },
      error: null
    });

    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument();
    });
  });

  it('should have accessible form elements', () => {
    renderWithProviders(<Signup />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    expect(firstNameInput).toBeRequired();
    expect(lastNameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should link to login page', () => {
    renderWithProviders(<Signup />);

    const loginLink = screen.getByRole('link', { name: /sign in/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should handle weak password validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Signup />);

    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should handle special characters in names', async () => {
    const user = userEvent.setup();
    const mockSuccessResponse = {
      data: {
        user: {
          id: 'user-123',
          email: 'josé@example.com',
          user_metadata: {
            first_name: 'José',
            last_name: 'García'
          }
        },
        session: null
      },
      error: null
    };

    mockSignupUser.mockResolvedValue(mockSuccessResponse);
    renderWithProviders(<Signup />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(firstNameInput, 'José');
    await user.type(lastNameInput, 'García');
    await user.type(emailInput, 'josé@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignupUser).toHaveBeenCalledWith(
        'josé@example.com',
        'password123',
        {
          first_name: 'José',
          last_name: 'García'
        }
      );
    });
  });
});