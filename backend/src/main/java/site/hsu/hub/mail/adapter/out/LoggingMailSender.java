package site.hsu.hub.mail.adapter.out;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile; import org.springframework.stereotype.Component;
import site.hsu.hub.mail.api.MailSender;
@Component @Profile({"local","dev","test"})
class LoggingMailSender implements MailSender {
 private static final Logger log= LoggerFactory.getLogger(LoggingMailSender.class);
 public void sendVerification(String email,String rawToken){log.info("Local verification mail queued");}
 public void sendPasswordReset(String email,String rawToken){log.info("Local password reset mail queued");}
}
