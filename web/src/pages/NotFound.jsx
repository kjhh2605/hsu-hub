import React from 'react';
import { LayoutDashboard, LayoutGrid, MapPinOff } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <EmptyState
        icon={MapPinOff}
        title="페이지를 찾을 수 없습니다"
        desc="주소가 변경되었거나 삭제된 화면입니다. 전체 화면 목록에서 다시 찾아보세요."
        action={
          <div className="flex gap-2">
            <Button to="/screens" variant="secondary" size="md" icon={LayoutGrid}>
              전체 화면 목록
            </Button>
            <Button to="/admin" size="md" icon={LayoutDashboard}>
              대시보드로 이동
            </Button>
          </div>
        }
      />
    </div>
  );
}
