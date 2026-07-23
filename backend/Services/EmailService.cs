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

        public void SendApprovalEmail(
    string toEmail,
    string fullName
)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var username = _config["EmailSettings:Username"];
            var smtpPassword = _config["EmailSettings:Password"];
            var senderName = _config["EmailSettings:SenderName"];


            using var smtp = new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, smtpPassword),
                EnableSsl = true
            };


            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Your Account Has Been Approved",
                Body =
                $"""
        Hello {fullName},

        Your account registration has been approved.

        You may now login using the credentials below:

        Email:
        {toEmail}


        Please change your password after your first login.

        Thank you.
        """,
                IsBodyHtml = false
            };


            mail.To.Add(toEmail);

            smtp.Send(mail);
        }

        public void SendRejectionEmail(string toEmail, string fullName, string reason)
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
                Subject = "Account Registration Rejected",
                Body =
                $"""
        Hello {fullName},

        Unfortunately, your account registration has been rejected.

        Reason:
        {reason}

        If you believe this was a mistake, please contact the administrator.

        Thank you.
        """,
                IsBodyHtml = false
            };

            mail.To.Add(toEmail);

            smtp.Send(mail);
        }

        public void SendAccountCreatedEmail(
    string toEmail,
    string fullName,
    string password
)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]);
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var username = _config["EmailSettings:Username"];
            var smtpPassword = _config["EmailSettings:Password"];
            var senderName = _config["EmailSettings:SenderName"];

            using var smtp = new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, smtpPassword),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Your Account Has Been Created",
                Body =
                $"""
        Hello {fullName},

        Your account has been created by the administrator.

        You can now login to the system using the credentials below:

        Email:
        {toEmail}

        Password:
        {password}

        Please login and change your password after your first login.

        Thank you.
        """,
                IsBodyHtml = false
            };

            mail.To.Add(toEmail);

            smtp.Send(mail);
        }
    }
}
