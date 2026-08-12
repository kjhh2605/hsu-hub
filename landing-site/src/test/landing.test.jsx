import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('HSU Club landing page', () => {
  test('renders the core promise and agreed feature stories', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '동아리 지원부터 면접까지, 한곳에서 끝내세요.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '모집 중인 동아리를 한눈에' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '지원한 순간부터 면접까지 놓치지 않게',
      }),
    ).toBeInTheDocument();
  });

  test('sends every primary action to the student explore route', () => {
    render(<App />);

    const links = screen.getAllByRole('link', {
      name: '모집 중인 동아리 보기',
    });
    expect(links.length).toBeGreaterThanOrEqual(3);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/explore'));
  });
});
