package site.hsu.hub;
import org.flywaydb.core.Flyway;import org.junit.jupiter.api.Test;import org.testcontainers.containers.MySQLContainer;import org.testcontainers.junit.jupiter.*;import java.sql.DriverManager;import static org.assertj.core.api.Assertions.assertThat;
@Testcontainers(disabledWithoutDocker=true)class FlywayMySqlTest{
 @Container static final MySQLContainer<?>MYSQL=new MySQLContainer<>("mysql:8.4").withDatabaseName("hsu_hub").withUsername("test").withPassword("test");
 @Test void migrationsCreateConstraintsAndSeedClubs()throws Exception{var result=Flyway.configure().dataSource(MYSQL.getJdbcUrl(),MYSQL.getUsername(),MYSQL.getPassword()).locations("classpath:db/migration").load().migrate();assertThat(result.migrationsExecuted).isEqualTo(4);try(var connection=DriverManager.getConnection(MYSQL.getJdbcUrl(),MYSQL.getUsername(),MYSQL.getPassword());var statement=connection.createStatement();var rows=statement.executeQuery("select count(*) from clubs")){rows.next();assertThat(rows.getInt(1)).isEqualTo(5);}}
}
