import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the empty handheld frame with the showroom brand', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'London Paint Showroom: Shift Simulator' })).toBeInTheDocument();
    expect(screen.getByText('LONDON PAINT SHOWROOM')).toBeInTheDocument();
  });
});
