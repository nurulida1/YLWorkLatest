using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RepairSalesOrderItemQuantityAllocated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Schema changes skipped in 20260622083530_UpdateAllTables (no-op partial apply).

            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityRemaining') > 0
                    AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityAllocated') = 0,
                    'ALTER TABLE `SalesOrderItems` CHANGE `QuantityRemaining` `QuantityAllocated` decimal(65,30) NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityAllocated') = 0,
                    'ALTER TABLE `SalesOrderItems` ADD `QuantityAllocated` decimal(65,30) NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityDelivered') = 0,
                    'ALTER TABLE `SalesOrderItems` ADD `QuantityDelivered` decimal(65,30) NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityOnHand') > 0,
                    'ALTER TABLE `SalesOrderItems` DROP COLUMN `QuantityOnHand`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'SalesOrderItems' AND COLUMN_NAME = 'QuantityOrdered') > 0,
                    'ALTER TABLE `SalesOrderItems` DROP COLUMN `QuantityOrdered`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
