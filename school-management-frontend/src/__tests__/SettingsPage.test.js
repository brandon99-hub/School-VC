import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../components/ProfilePage';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../hooks/useApi', () => ({
    useApi: jest.fn(),
}));

const mockLoadUser = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();

const mockProfile = {
    id: 1,
    first_name: 'Jamie',
    last_name: 'Lee',
    email: 'jamie@example.com',
    phone: '123-456-7890',
    address: '123 Demo Street',
    grade: 'Form 3',
    course_count: 3,
    attendance_rate: 95,
    role: 'student',
};

describe('Settings (ProfilePage)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockResolvedValue(mockProfile);
        mockPut.mockResolvedValue(mockProfile);
        useApi.mockReturnValue({ get: mockGet, put: mockPut });
        useAuth.mockReturnValue({ loadUser: mockLoadUser });
    });

    it('loads profile data and allows saving updates', async () => {
        render(<ProfilePage />);

        expect(await screen.findByText(/Settings/)).toBeInTheDocument();

        const firstNameInput = screen.getByLabelText(/First name/i);
        fireEvent.change(firstNameInput, { target: { value: 'Jamie-Updated' } });

        const saveButton = screen.getByRole('button', { name: /Save changes/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/api/auth/profile/', expect.objectContaining({ first_name: 'Jamie-Updated' }));
        });
    });

    it('switches between sections', async () => {
        render(<ProfilePage />);

        expect(await screen.findByText(/Settings/)).toBeInTheDocument();
        const contactTabs = screen.getAllByRole('button', { name: /Contact/i });
        fireEvent.click(contactTabs[1] || contactTabs[0]);

        expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    });
});

