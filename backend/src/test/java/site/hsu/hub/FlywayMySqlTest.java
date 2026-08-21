package site.hsu.hub;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers(disabledWithoutDocker = true)
class FlywayMySqlTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
        .withDatabaseName("hsu_hub")
        .withUsername("test")
        .withPassword("test");

    @Test
    void migrationsCreateTheKakaoUserSchemaWithoutLegacyAuthenticationArtifacts() throws Exception {
        Flyway legacy = Flyway.configure()
            .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
            .locations("classpath:db/migration")
            .target(MigrationVersion.fromVersion("4"))
            .load();
        legacy.migrate();

        try (Connection connection = DriverManager.getConnection(
            MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
             var statement = connection.createStatement()) {
            statement.executeUpdate("""
                insert into users (
                    email_normalized, password_hash, email_verified_at,
                    service_role, status, created_at, updated_at
                ) values (
                    'legacy@example.com', 'legacy-hash', current_timestamp(6),
                    'APPLICANT', 'ACTIVE', current_timestamp(6), current_timestamp(6)
                )
                """);
        }

        Flyway latest = Flyway.configure()
            .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
            .locations("classpath:db/migration")
            .cleanDisabled(false)
            .load();
        assertThatThrownBy(latest::migrate).hasMessageContaining("V5__replace_email_auth_with_kakao.sql");
        try (Connection connection = DriverManager.getConnection(
            MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())) {
            assertThat(queryNames(connection,
                "select column_name from information_schema.columns " +
                    "where table_schema = database() and table_name = 'users'"))
                .contains("password_hash", "email_verified_at", "email_normalized")
                .doesNotContain("kakao_user_id");
            assertThat(queryNames(connection,
                "select table_name from information_schema.tables where table_schema = database()"))
                .contains("email_verification_tokens", "password_reset_tokens");
        }

        latest.clean();
        var result = latest.migrate();

        assertThat(result.migrationsExecuted).isEqualTo(6);
        try (Connection connection = DriverManager.getConnection(
            MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())) {
            assertThat(queryNames(connection,
                "select column_name from information_schema.columns " +
                    "where table_schema = database() and table_name = 'users'"))
                .contains("kakao_user_id", "email")
                .doesNotContain("password_hash", "email_verified_at", "email_normalized");
            assertThat(queryNames(connection,
                "select table_name from information_schema.tables where table_schema = database()"))
                .contains("club_introduction_images")
                .doesNotContain("email_verification_tokens", "password_reset_tokens");
            assertThat(queryNames(connection,
                "select column_name from information_schema.columns " +
                    "where table_schema = database() and table_name = 'clubs'"))
                .contains("recruitment_status");
            assertThat(singleInt(connection, "select count(*) from clubs")).isEqualTo(5);
        }
    }

    private static Set<String> queryNames(Connection connection, String sql) throws Exception {
        Set<String> names = new HashSet<>();
        try (var statement = connection.createStatement(); var rows = statement.executeQuery(sql)) {
            while (rows.next()) names.add(rows.getString(1).toLowerCase());
        }
        return names;
    }

    private static int singleInt(Connection connection, String sql) throws Exception {
        try (var statement = connection.createStatement(); var rows = statement.executeQuery(sql)) {
            rows.next();
            return rows.getInt(1);
        }
    }
}
