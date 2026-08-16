import { useNavigate } from 'react-router-dom';
import { Screen, TopBar } from '../components/layout.jsx';
import { Button, EmptyState } from '../components/ui.jsx';
import { Compass } from '../components/icons.jsx';

export default function NotFoundScreen() {
  const nav = useNavigate();
  return (
    <>
      <TopBar title="페이지를 찾을 수 없음" back />
      <Screen>
        <EmptyState
          icon={<Compass size={26} />}
          title="존재하지 않는 화면입니다"
          desc={'주소가 변경되었거나 삭제된 페이지예요.'}
          action={<Button onClick={() => nav('/explore')}>탐색으로 이동</Button>}
        />
      </Screen>
    </>
  );
}
