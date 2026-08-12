import { render, screen, within } from '@testing-library/react';
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

  test('explains the hero artwork to non-visual users', () => {
    render(<App />);

    expect(
      screen.getByRole('img', {
        name: /HSU 캐릭터가 여러 모집 도구 사이에서/,
      }),
    ).toBeInTheDocument();
  });

  test('provides navigation to the comparison and feature proof', () => {
    render(<App />);

    expect(
      screen.getByRole('link', { name: '기존 방식과 비교' }),
    ).toHaveAttribute('href', '#compare');
    expect(screen.getByRole('link', { name: '주요 기능' })).toHaveAttribute(
      'href',
      '#features',
    );
  });

  test('describes the four real-world tool transitions', () => {
    render(<App />);

    ['모집 확인', '지원', '지원 이후', '면접 조율'].forEach((step) => {
      expect(screen.getAllByText(step).length).toBeGreaterThanOrEqual(1);
    });
    expect(
      screen.getAllByText('공고마다 연결된 별도의 Google Form으로 이동')
        .length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(
        '별도의 Google Sheets 링크에서 가능 시간을 확인·기입',
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });

  test('keeps applying as a journey step instead of a standalone feature', () => {
    render(<App />);

    expect(screen.getByText('지원하기')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '간편 지원' }),
    ).not.toBeInTheDocument();
  });

  test('proves value with only the two agreed standalone feature stories', () => {
    render(<App />);

    const stories = screen.getAllByTestId('feature-story');
    expect(stories).toHaveLength(2);
    expect(within(stories[0]).getByText('카테고리 탐색')).toBeInTheDocument();
    expect(within(stories[1]).getByText('진행 상태 확인')).toBeInTheDocument();
    expect(
      within(stories[1]).getByText('면접 시간 선택·변경'),
    ).toBeInTheDocument();
  });

  test('closes with the agreed action and service identity', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: '놓치고 싶지 않은 동아리를 지금 찾아보세요.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('한성대학교 학생을 위한 동아리 모집·지원 서비스'),
    ).toBeInTheDocument();
    expect(screen.getByText('© 2026 HSU Club')).toBeInTheDocument();
  });
});
