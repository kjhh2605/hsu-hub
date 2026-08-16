package site.hsu.hub.mail.api;
public interface MailSender {
 void sendVerification(String email,String rawToken);
 void sendPasswordReset(String email,String rawToken);
}
