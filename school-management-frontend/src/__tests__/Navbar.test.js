import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../hooks/useApi', () => ({
    useApi: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock(
    'react-router-dom',
    () => ({
    Link: ({ children, to, ...rest }) => (
        <a href={typeof to === 'string' ? to : '#'} {...rest}>
            {children}
        </a>
    ),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    }),
    { virtual: true }
);

const mockLogout = jest.fn();
const mockGet = jest.fn();

const teacherUser = {
    id: 1,
    first_name: 'Taylor',
    last_name: 'Swift',
    email: 'taylor@example.com',
    role: 'teacher',
};

describe('Navbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGet.mockResolvedValue([]);
        useApi.mockReturnValue({ get: mockGet });
        useAuth.mockReturnValue({
            user: teacherUser,
            logout: mockLogout,
        });
    });

    it('renders role-specific quick links inside the dropdown', async () => {
        render(<Navbar />);

        fireEvent.click(screen.getByLabelText(/User menu/i));
        expect(await screen.findByText(/Class Attendance/i)).toBeInTheDocument();
    });

    it('filters quick links using the search box', async () => {
        render(<Navbar />);

        fireEvent.click(screen.getByLabelText(/User menu/i));
        const searchInput = screen.getByPlaceholderText(/Filter destinations/i);
        fireEvent.change(searchInput, { target: { value: 'settings' } });

        await waitFor(() => {
            const quickList = screen.getByTestId('quick-link-list');
            expect(within(quickList).getByText(/Settings/i)).toBeInTheDocument();
        });
    });

    it('requests notifications for the signed-in user', async () => {
        render(<Navbar />);

        fireEvent.click(screen.getByLabelText(/User menu/i));
        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith('/api/notifications/');
        });
    });
});

