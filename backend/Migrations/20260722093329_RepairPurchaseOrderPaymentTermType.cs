using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RepairPurchaseOrderPaymentTermType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Schema changes skipped in 20260626085219_UpdatePOAndInvoice (no-op partial apply).

            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'PurchaseOrders' AND COLUMN_NAME = 'PaymentTermType') = 0,
                    'ALTER TABLE `PurchaseOrders` ADD `PaymentTermType` longtext CHARACTER SET utf8mb4 NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @paymentTermsType = (
                    SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'PurchaseOrders' AND COLUMN_NAME = 'PaymentTerms'
                    LIMIT 1);

                SET @sql = IF(
                    @paymentTermsType IN ('longtext', 'varchar', 'text', 'mediumtext', 'tinytext'),
                    'UPDATE `PurchaseOrders` SET `PaymentTerms` = NULL WHERE `PaymentTerms` IS NOT NULL AND `PaymentTerms` NOT REGEXP ''^[0-9]+$''',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @sql = IF(
                    @paymentTermsType IN ('longtext', 'varchar', 'text', 'mediumtext', 'tinytext'),
                    'ALTER TABLE `PurchaseOrders` MODIFY `PaymentTerms` int NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                SET @dueDateNullable = (
                    SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'Invoices' AND COLUMN_NAME = 'DueDate'
                    LIMIT 1);

                SET @sql = IF(
                    @dueDateNullable = 'NO',
                    'ALTER TABLE `Invoices` MODIFY `DueDate` datetime(6) NULL',
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
