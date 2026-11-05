
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

        private SmtpClient CreateSmtpClient()
        {
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var port = int.Parse(_config["EmailSettings:Port"]!);
            var username = _config["EmailSettings:Username"];
            var password = _config["EmailSettings:Password"];

            return new SmtpClient(smtpServer)
            {
                Port = port,
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };
        }

        private MailMessage CreateMailMessage(
            string toEmail,
            string subject,
            string body,
            bool isHtml = false)
        {
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var senderName = _config["EmailSettings:SenderName"];

            var mail = new MailMessage
            {
                From = new MailAddress(senderEmail!, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml
            };

            mail.To.Add(toEmail);

            return mail;
        }

        // General asynchronous email method.
        // Used by MeetingController for invitations, updates and cancellations.
        public async Task SendEmailAsync(
            string toEmail,
            string subject,
            string body)
        {
            using var smtp = CreateSmtpClient();
            using var mail = CreateMailMessage(
                toEmail,
                subject,
                body,
                isHtml: true
            );

            await smtp.SendMailAsync(mail);
        }

        // Password reset email
        public void SendResetEmail(string toEmail, string resetLink)
        {
            var body = $"""
                Hello,

                Click the link below to reset your password:

                {resetLink}

                This link will expire in 1 hour.

                If you didn't request this, please ignore this email.
                """;

            using var smtp = CreateSmtpClient();
            using var mail = CreateMailMessage(
                toEmail,
                "Password Reset Instructions",
                body
            );

            smtp.Send(mail);
        }

        // Account approval email
        public void SendApprovalEmail(
            string toEmail,
            string fullName)
        {
            var body = $"""
                Hello {fullName},

                Your account registration has been approved.

                You may now log in using the following email:

                {toEmail}

                Please change your password after your first login.

                Thank you.
                """;

            using var smtp = CreateSmtpClient();
            using var mail = CreateMailMessage(
                toEmail,
                "Your Account Has Been Approved",
                body
            );

            smtp.Send(mail);
        }

        // Account rejection email
        public void SendRejectionEmail(
            string toEmail,
            string fullName,
            string reason)
        {
            var body = $"""
                Hello {fullName},

                Unfortunately, your account registration has been rejected.

                Reason:
                {reason}

                If you believe this was a mistake, please contact the administrator.

                Thank you.
                """;

            using var smtp = CreateSmtpClient();
            using var mail = CreateMailMessage(
                toEmail,
                "Account Registration Rejected",
                body
            );

            smtp.Send(mail);
        }

        // Account created email
        public void SendAccountCreatedEmail(
            string toEmail,
            string fullName,
            string password)
        {
            var body = $"""
                Hello {fullName},

                Your account has been created by the administrator.

                You can now log in using the credentials below:

                Email:
                {toEmail}

                Password:
                {password}

                Please log in and change your password after your first login.

                Thank you.
                """;

            using var smtp = CreateSmtpClient();
            using var mail = CreateMailMessage(
                toEmail,
                "Your Account Has Been Created",
                body
            );

            smtp.Send(mail);
        }
    }
}
