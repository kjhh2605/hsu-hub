package site.hsu.hub.mail.adapter.out;
import org.springframework.beans.factory.annotation.Value; import org.springframework.context.annotation.Profile; import org.springframework.stereotype.Component;
import site.hsu.hub.common.exception.ApiException; import site.hsu.hub.common.exception.ErrorCode; import site.hsu.hub.mail.api.MailSender;
import software.amazon.awssdk.services.sesv2.SesV2Client; import software.amazon.awssdk.services.sesv2.model.*;
@Component @Profile("prod")
class SesMailSender implements MailSender {
 private final SesV2Client ses; private final String from; private final String applicantBase;
 SesMailSender(SesV2Client ses,@Value("${hsu.mail.from:no-reply@hsu-hub.site}") String from,@Value("${hsu.applicant-base:https://hsu-hub.site}") String applicantBase){this.ses=ses;this.from=from;this.applicantBase=applicantBase;}
 public void sendVerification(String email,String token){send(email,"HSU Hub 이메일 인증",applicantBase+"/verify-email?token="+token);}
 public void sendPasswordReset(String email,String token){send(email,"HSU Hub 비밀번호 재설정",applicantBase+"/reset-password?token="+token);}
 private void send(String email,String subject,String body){try{ses.sendEmail(SendEmailRequest.builder().fromEmailAddress(from).destination(Destination.builder().toAddresses(email).build()).content(EmailContent.builder().simple(Message.builder().subject(Content.builder().data(subject).charset("UTF-8").build()).body(Body.builder().text(Content.builder().data(body).charset("UTF-8").build()).build()).build()).build()).build());}catch(RuntimeException e){throw new ApiException(ErrorCode.MAIL_UNAVAILABLE);}}
}
