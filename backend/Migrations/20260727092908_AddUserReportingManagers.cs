using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(YLWorks.Data.AppDbContext))]
    [Migration("20260727092908_AddUserReportingManagers")]
    public partial class AddUserReportingManagers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'UserReportingManagers') = 0,
                    'CREATE TABLE `UserReportingManagers` (
                        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
                        `ManagerId` char(36) COLLATE ascii_general_ci NOT NULL,
                        PRIMARY KEY (`UserId`, `ManagerId`),
                        KEY `IX_UserReportingManagers_ManagerId` (`ManagerId`),
                        CONSTRAINT `FK_UserReportingManagers_Users_UserId`
                            FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
                        CONSTRAINT `FK_UserReportingManagers_Users_ManagerId`
                            FOREIGN KEY (`ManagerId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'HodId') > 0,
                    'INSERT IGNORE INTO `UserReportingManagers` (`UserId`, `ManagerId`)
                     SELECT `Id`, `HodId` FROM `Users`
                     WHERE `HodId` IS NOT NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @fk = (
                    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'HodId'
                      AND REFERENCED_TABLE_NAME = 'Users'
                    LIMIT 1);
                SET @sql = IF(@fk IS NOT NULL,
                    CONCAT('ALTER TABLE `Users` DROP FOREIGN KEY `', @fk, '`'),
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND INDEX_NAME = 'IX_Users_HodId') > 0,
                    'DROP INDEX `IX_Users_HodId` ON `Users`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'HodId') > 0,
                    'ALTER TABLE `Users` DROP COLUMN `HodId`',
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
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'HodId') = 0,
                    'ALTER TABLE `Users` ADD `HodId` char(36) COLLATE ascii_general_ci NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users' AND INDEX_NAME = 'IX_Users_HodId') = 0,
                    'CREATE INDEX `IX_Users_HodId` ON `Users` (`HodId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Users'
                       AND CONSTRAINT_NAME = 'FK_Users_Users_HodId') = 0,
                    'ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Users_HodId`
                        FOREIGN KEY (`HodId`) REFERENCES `Users` (`Id`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                UPDATE `Users` u
                INNER JOIN (
                    SELECT `UserId`, MIN(`ManagerId`) AS `ManagerId`
                    FROM `UserReportingManagers`
                    GROUP BY `UserId`
                ) rm ON rm.UserId = u.Id
                SET u.HodId = rm.ManagerId
                WHERE u.HodId IS NULL;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'UserReportingManagers') > 0,
                    'DROP TABLE `UserReportingManagers`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }
    }
}
