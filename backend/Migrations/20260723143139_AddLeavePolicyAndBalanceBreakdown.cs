using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddLeavePolicyAndBalanceBreakdown : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveTypes' AND COLUMN_NAME = 'PolicyKind') = 0,
                    'ALTER TABLE `LeaveTypes` ADD `PolicyKind` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT ''Fixed''',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveBalances' AND COLUMN_NAME = 'TenureEntitledDays') = 0,
                    'ALTER TABLE `LeaveBalances` ADD `TenureEntitledDays` double NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveBalances' AND COLUMN_NAME = 'CarriedForwardDays') = 0,
                    'ALTER TABLE `LeaveBalances` ADD `CarriedForwardDays` double NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveBalances' AND COLUMN_NAME = 'CreditedDays') = 0,
                    'ALTER TABLE `LeaveBalances` ADD `CreditedDays` double NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                UPDATE `LeaveBalances`
                SET `TenureEntitledDays` = `EntitledDays`
                WHERE IFNULL(`TenureEntitledDays`, 0) = 0 AND `EntitledDays` > 0;

                CREATE TABLE IF NOT EXISTS `LeavePolicies` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `EffectiveFromYear` int NOT NULL,
                    `AnnualCarryForwardPercent` double NOT NULL,
                    `IsActive` tinyint(1) NOT NULL,
                    `CreatedAt` datetime(6) NULL,
                    `UpdatedAt` datetime(6) NULL,
                    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                    PRIMARY KEY (`Id`)
                ) CHARACTER SET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `LeaveTenureBands` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `LeavePolicyId` char(36) COLLATE ascii_general_ci NOT NULL,
                    `BandKind` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
                    `MinYearsInclusive` int NOT NULL,
                    `MaxYearsExclusive` int NULL,
                    `DaysPerYear` double NOT NULL,
                    `CreatedAt` datetime(6) NULL,
                    `UpdatedAt` datetime(6) NULL,
                    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                    PRIMARY KEY (`Id`),
                    KEY `IX_LeaveTenureBands_LeavePolicyId` (`LeavePolicyId`),
                    CONSTRAINT `FK_LeaveTenureBands_LeavePolicies_LeavePolicyId`
                        FOREIGN KEY (`LeavePolicyId`) REFERENCES `LeavePolicies` (`Id`) ON DELETE CASCADE
                ) CHARACTER SET=utf8mb4;

                CREATE TABLE IF NOT EXISTS `LeaveYearCloses` (
                    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
                    `ClosedYear` int NOT NULL,
                    `ClosedAt` datetime(6) NOT NULL,
                    `ClosedByUserId` char(36) COLLATE ascii_general_ci NULL,
                    `Notes` longtext CHARACTER SET utf8mb4 NULL,
                    `CreatedAt` datetime(6) NULL,
                    `UpdatedAt` datetime(6) NULL,
                    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
                    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
                    PRIMARY KEY (`Id`),
                    UNIQUE KEY `IX_LeaveYearCloses_ClosedYear` (`ClosedYear`)
                ) CHARACTER SET=utf8mb4;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS `LeaveYearCloses`;
                DROP TABLE IF EXISTS `LeaveTenureBands`;
                DROP TABLE IF EXISTS `LeavePolicies`;
                """);
        }
    }
}
