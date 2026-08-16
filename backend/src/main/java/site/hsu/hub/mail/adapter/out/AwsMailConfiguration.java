package site.hsu.hub.mail.adapter.out;
import org.springframework.context.annotation.Bean; import org.springframework.context.annotation.Configuration; import org.springframework.context.annotation.Profile; import software.amazon.awssdk.services.sesv2.SesV2Client;
@Configuration @Profile("prod") class AwsMailConfiguration { @Bean SesV2Client sesV2Client(){return SesV2Client.create();} }
