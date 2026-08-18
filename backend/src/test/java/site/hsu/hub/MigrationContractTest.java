package site.hsu.hub;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class MigrationContractTest {
    @Test
    void kakaoMigrationGuardsTheEmptyPlatformBeforeDestructiveDdl() throws Exception {
        var resource = getClass().getResourceAsStream(
            "/db/migration/V5__replace_email_auth_with_kakao.sql");
        assertThat(resource).isNotNull();
        String sql;
        try (resource) {
            sql = new String(resource.readAllBytes(), StandardCharsets.UTF_8);
        }

        int guard = sql.indexOf("ck_kakao_migration_requires_empty_users");
        int firstDrop = sql.indexOf("DROP TABLE");
        int guardRemoval = sql.lastIndexOf("DROP CHECK ck_kakao_migration_requires_empty_users");

        assertThat(sql).contains("CHECK (created_at IS NULL)");
        assertThat(guard).isGreaterThanOrEqualTo(0).isLessThan(firstDrop);
        assertThat(guardRemoval).isGreaterThan(firstDrop);
    }
}
