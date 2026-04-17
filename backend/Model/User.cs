using System.ComponentModel.DataAnnotations;

namespace YLWorks.Model
{
    public class User : BaseEntity
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ContactNo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid? DepartmentId { get; set; }
        public ICollection<Department> Departments { get; set; }
        public DateTime? JoinedDate { get; set; }
        public string? AccessPermission { get; set; }
        public string EmployeeNo { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string SystemRole { get; set; } = "Staff";
        public string? Gender { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;
        public Guid? HodId { get; set; }
        public User? Hod { get; set; }

        // Refresh token support
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? ContactNo { get; set; }
        public string JobTitle {  get; set; } = string.Empty;
        public string? Gender { get; set; } = string.Empty;
        public DateTime? JoinedDate { get; set; }
        public Guid? HodId { get; set; }
        

    }

    public class PasswordResetToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
        public User User { get; set; } = null!;
    }


    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

  
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string ContactNo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName {  get; set; } = string.Empty;
        public string EmployeeNo { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string? Gender { get; set; } = string.Empty;
        public DateTime? JoinedDate { get; set; }
        public Guid? HodId { get; set; }
        public string? SystemRole { get; set; }
        public DateTime? UpdatedAt { get; set; }    
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;

    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string EmployeeNo { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string SystemRole { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public string Gender { get; set; }
        public Guid? HodId { get; set; }
        public User? Hod { get; set; }
        public List<string> Departments { get; set; } = new();
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? JoinedDate { get; set; }
        public Guid? HodId { get; set; }
        public string? SystemRole { get; set; }
        public string? Gender { get; set; }
    }

}
