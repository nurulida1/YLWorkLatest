using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaveCalendarSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarConnections') = 0,
                    'CREATE TABLE `LeaveCalendarConnections` (
                        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
                        `Provider` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
                        `AccessTokenProtected` longtext CHARACTER SET utf8mb4 NOT NULL,
                        `RefreshTokenProtected` longtext CHARACTER SET utf8mb4 NOT NULL,
                        `TokenExpiresAtUtc` datetime(6) NOT NULL,
                        `ExternalCalendarId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                        `ExternalAccountEmail` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                        `ConnectedAtUtc` datetime(6) NOT NULL,
                        `LastSyncAtUtc` datetime(6) NULL,
                        `LastError` longtext CHARACTER SET utf8mb4 NULL,
                        `CreatedAt` datetime(6) NULL,
                        `UpdatedAt` datetime(6) NULL,
                        `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                        `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                        PRIMARY KEY (`Id`),
                        UNIQUE KEY `IX_LeaveCalendarConnections_UserId_Provider` (`UserId`, `Provider`),
                        CONSTRAINT `FK_LeaveCalendarConnections_Users_UserId`
                            FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarEventMaps') = 0,
                    'CREATE TABLE `LeaveCalendarEventMaps` (
                        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                        `ConnectionId` char(36) COLLATE ascii_general_ci NOT NULL,
                        `LeaveRequestId` char(36) COLLATE ascii_general_ci NOT NULL,
                        `ExternalEventId` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
                        `CreatedAt` datetime(6) NULL,
                        `UpdatedAt` datetime(6) NULL,
                        `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                        `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                        PRIMARY KEY (`Id`),
                        UNIQUE KEY `IX_LeaveCalendarEventMaps_ConnectionId_LeaveRequestId` (`ConnectionId`, `LeaveRequestId`),
                        KEY `IX_LeaveCalendarEventMaps_LeaveRequestId` (`LeaveRequestId`),
                        CONSTRAINT `FK_LeaveCalendarEventMaps_LeaveCalendarConnections_ConnectionId`
                            FOREIGN KEY (`ConnectionId`) REFERENCES `LeaveCalendarConnections` (`Id`) ON DELETE CASCADE,
                        CONSTRAINT `FK_LeaveCalendarEventMaps_LeaveRequests_LeaveRequestId`
                            FOREIGN KEY (`LeaveRequestId`) REFERENCES `LeaveRequests` (`Id`) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarEventMaps') > 0,
                    'DROP TABLE `LeaveCalendarEventMaps`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveCalendarConnections') > 0,
                    'DROP TABLE `LeaveCalendarConnections`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }
    }
}
