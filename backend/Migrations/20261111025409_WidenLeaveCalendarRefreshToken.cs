using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class WidenLeaveCalendarRefreshToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Encrypted Google refresh tokens exceed varchar(255). Keep a 64-char prefix
            // index so Outlook ICS SHA-256 hash lookups stay indexed.
            migrationBuilder.Sql("""
                SET @idx_exists := (
                    SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'LeaveCalendarConnections'
                      AND INDEX_NAME = 'IX_LeaveCalendarConnections_RefreshTokenProtected'
                );
                SET @sql := IF(
                    @idx_exists > 0,
                    'ALTER TABLE `LeaveCalendarConnections` DROP INDEX `IX_LeaveCalendarConnections_RefreshTokenProtected`',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                ALTER TABLE `LeaveCalendarConnections`
                    MODIFY `RefreshTokenProtected` longtext CHARACTER SET utf8mb4 NOT NULL;

                SET @idx_exists := (
                    SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'LeaveCalendarConnections'
                      AND INDEX_NAME = 'IX_LeaveCalendarConnections_RefreshTokenProtected'
                );
                SET @sql := IF(
                    @idx_exists = 0,
                    'ALTER TABLE `LeaveCalendarConnections` ADD INDEX `IX_LeaveCalendarConnections_RefreshTokenProtected` (`RefreshTokenProtected`(64))',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @idx_exists := (
                    SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'LeaveCalendarConnections'
                      AND INDEX_NAME = 'IX_LeaveCalendarConnections_RefreshTokenProtected'
                );
                SET @sql := IF(
                    @idx_exists > 0,
                    'ALTER TABLE `LeaveCalendarConnections` DROP INDEX `IX_LeaveCalendarConnections_RefreshTokenProtected`',
                    'SELECT 1'
                );
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                ALTER TABLE `LeaveCalendarConnections`
                    MODIFY `RefreshTokenProtected` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

                ALTER TABLE `LeaveCalendarConnections`
                    ADD INDEX `IX_LeaveCalendarConnections_RefreshTokenProtected` (`RefreshTokenProtected`);
                """);
        }
    }
}
