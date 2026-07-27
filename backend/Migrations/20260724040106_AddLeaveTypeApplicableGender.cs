using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaveTypeApplicableGender : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();

                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveTypes' AND COLUMN_NAME = 'ApplicableGender') = 0,
                    'ALTER TABLE `LeaveTypes` ADD `ApplicableGender` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT ''All''',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

                UPDATE `LeaveTypes`
                SET `ApplicableGender` = 'All'
                WHERE `ApplicableGender` IS NULL OR TRIM(`ApplicableGender`) = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @db = DATABASE();
                SET @sql = IF(
                    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'LeaveTypes' AND COLUMN_NAME = 'ApplicableGender') > 0,
                    'ALTER TABLE `LeaveTypes` DROP COLUMN `ApplicableGender`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
                """);
        }
    }
}
