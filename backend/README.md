# HSU Hub backend

Java 21, Spring Boot, Spring Modulith, MySQL/Flyway 기반 단일 서비스입니다.

```bash
./gradlew test
./gradlew bootJar
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

`local`, `dev`, `test` 프로필은 로컬 파일 저장소와 로그 메일 adapter를 사용합니다. `prod`는 EC2 역할 자격 증명으로 S3와 SES adapter만 활성화하며 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `HSU_STORAGE_BUCKET`을 환경 또는 Secrets Manager 주입으로 받아야 합니다. 운영자 권한은 UI로 만들지 않으며 검증 완료 사용자와 `club_users(user_id, club_id, club_role='OPERATOR')` 행을 운영 절차로 직접 연결합니다.
