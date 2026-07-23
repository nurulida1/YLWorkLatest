using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RepairSkippedUpdateAllTablesSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Schema changes that were commented out / skipped in 20260622083530_UpdateAllTables
            // but are still expected by the EF model snapshot.

            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ProductServices' AND COLUMN_NAME = 'InventoryId') = 0,
                    'ALTER TABLE `ProductServices` ADD `InventoryId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ProductServices' AND COLUMN_NAME = 'InventoryId1') = 0,
                    'ALTER TABLE `ProductServices` ADD `InventoryId1` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ProductServices' AND INDEX_NAME = 'IX_ProductServices_InventoryId1') = 0,
                    'CREATE INDEX `IX_ProductServices_InventoryId1` ON `ProductServices` (`InventoryId1`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'ProductServices' AND CONSTRAINT_NAME = 'FK_ProductServices_Inventories_InventoryId1') = 0,
                    'ALTER TABLE `ProductServices` ADD CONSTRAINT `FK_ProductServices_Inventories_InventoryId1` FOREIGN KEY (`InventoryId1`) REFERENCES `Inventories` (`Id`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'GoodsReceivings' AND COLUMN_NAME = 'IsPostedToInventory') = 0,
                    'ALTER TABLE `GoodsReceivings` ADD `IsPostedToInventory` tinyint(1) NOT NULL DEFAULT 0',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Inventories' AND COLUMN_NAME = 'StockType') = 0,
                    'ALTER TABLE `Inventories` ADD `StockType` longtext CHARACTER SET utf8mb4 NOT NULL DEFAULT ('''')',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'PurchaseOrderItems' AND COLUMN_NAME = 'ProductServiceId') = 0,
                    'ALTER TABLE `PurchaseOrderItems` ADD `ProductServiceId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'PurchaseOrderItems' AND INDEX_NAME = 'IX_PurchaseOrderItems_ProductServiceId') = 0,
                    'CREATE INDEX `IX_PurchaseOrderItems_ProductServiceId` ON `PurchaseOrderItems` (`ProductServiceId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'PurchaseOrderItems' AND CONSTRAINT_NAME = 'FK_PurchaseOrderItems_ProductServices_ProductServiceId') = 0,
                    'ALTER TABLE `PurchaseOrderItems` ADD CONSTRAINT `FK_PurchaseOrderItems_ProductServices_ProductServiceId` FOREIGN KEY (`ProductServiceId`) REFERENCES `ProductServices` (`Id`) ON DELETE CASCADE',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Inventories' AND INDEX_NAME = 'IX_Inventories_ProductServiceId') = 0
                    AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Inventories' AND COLUMN_NAME = 'ProductServiceId') > 0,
                    'CREATE INDEX `IX_Inventories_ProductServiceId` ON `Inventories` (`ProductServiceId`)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Inventories' AND CONSTRAINT_NAME = 'FK_Inventories_ProductServices_ProductServiceId') = 0
                    AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Inventories' AND COLUMN_NAME = 'ProductServiceId') > 0,
                    'ALTER TABLE `Inventories` ADD CONSTRAINT `FK_Inventories_ProductServices_ProductServiceId` FOREIGN KEY (`ProductServiceId`) REFERENCES `ProductServices` (`Id`) ON DELETE SET NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'DeliveryOrderRMAs' AND COLUMN_NAME = 'RMANo') > 0
                    AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                         WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'DeliveryOrderRMAs' AND COLUMN_NAME = 'DeliveryOrderRMANo') = 0,
                    'ALTER TABLE `DeliveryOrderRMAs` CHANGE `RMANo` `DeliveryOrderRMANo` longtext CHARACTER SET utf8mb4 NOT NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'StockTransactions') = 0,
                    'CREATE TABLE `StockTransactions` (
                        `Id` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
                        `InventoryId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
                        `Type` longtext CHARACTER SET utf8mb4 NOT NULL,
                        `Quantity` decimal(65,30) NOT NULL,
                        `ReferenceType` longtext CHARACTER SET utf8mb4 NOT NULL,
                        `ReferenceId` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
                        `CreatedAt` datetime(6) NOT NULL,
                        CONSTRAINT `PK_StockTransactions` PRIMARY KEY (`Id`)
                    ) CHARACTER SET=utf8mb4',
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
