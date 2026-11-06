using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddBugReportFieldsToHardwareRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActualResult",
                table: "HardwareRequests",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AffectedModule",
                table: "HardwareRequests",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BugCategory",
                table: "HardwareRequests",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ExpectedResult",
                table: "HardwareRequests",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StepsToReproduce",
                table: "HardwareRequests",
                type: "varchar(4000)",
                maxLength: 4000,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActualResult",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "AffectedModule",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "BugCategory",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "ExpectedResult",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "StepsToReproduce",
                table: "HardwareRequests");
        }
    }
}
