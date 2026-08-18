# HSU Hub backend

Java 21, Spring Boot, Spring Modulith, MySQL/Flyway 기반 단일 서비스입니다.

```bash
./gradlew test
./gradlew bootJar
HSU_KAKAO_CLIENT_ID=KAKAO_REST_API_KEY \
HSU_KAKAO_CLIENT_SECRET=KAKAO_CLIENT_SECRET \
HSU_KAKAO_APPLICANT_ORIGIN=http://localhost:5173 \
HSU_KAKAO_ADMIN_ORIGIN=http://127.0.0.1:5174 \
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

`local`, `dev`, `test` 프로필은 로컬 파일 저장소를 사용합니다. `prod`는 EC2 역할 자격 증명으로 S3 adapter를 활성화하며 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `HSU_STORAGE_BUCKET`, `HSU_KAKAO_CLIENT_ID`, `HSU_KAKAO_CLIENT_SECRET`, `HSU_KAKAO_APPLICANT_ORIGIN`, `HSU_KAKAO_ADMIN_ORIGIN`을 환경 또는 Secrets Manager 주입으로 받아야 합니다. 운영자 권한은 UI로 만들지 않으며 카카오 로그인으로 생성된 사용자와 `club_users(user_id, club_id, club_role='OPERATOR')` 행을 운영 절차로 직접 연결합니다.

로컬에서는 applicant Vite 앱을 `http://localhost:5173`, operator Vite 앱을 `http://127.0.0.1:5174`에서 실행합니다. 쿠키는 포트를 구분하지 않으므로 두 앱의 host를 의도적으로 나눠 운영과 동일하게 host-only 세션을 분리합니다. 각 Vite 서버는 `/api`를 기본 `http://localhost:8080` 백엔드로 프록시하면서 신뢰된 `X-HSU-Frontend` 값을 붙입니다. 백엔드 주소가 다르면 프론트 실행 전에 `HSU_BACKEND_ORIGIN`을 설정합니다. 위 두 콜백 URI를 Kakao Developers에도 등록해야 합니다.
