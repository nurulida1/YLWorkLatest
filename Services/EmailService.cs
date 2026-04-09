using System.Net;
using System.Net.Mail;

namespace YLWorks.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public void SendResetEmail(string toEmail, string resetLink)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];
            var senderName = _config["EmailSettings:SenderName"];

            using var smtp = new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Password Reset Instructions",
                Body = $"Hello,\n\nClick the link below to reset your password:\n{resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn’t request this, please ignore this email.",
                IsBodyHtml = false
            };

            mail.To.Add(toEmail);

            smtp.Send(mail);
        }
    }
}
