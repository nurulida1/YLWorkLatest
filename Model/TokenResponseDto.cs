namespace YLWorks.Model
{
    public class TokenResponseDto
    {
        public string Token { get; set; }
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}