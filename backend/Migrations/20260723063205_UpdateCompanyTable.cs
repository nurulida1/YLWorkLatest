using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCompanyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ContactPerson2",
                table: "Companies",
                newName: "SecondaryEmail");

            migrationBuilder.RenameColumn(
                name: "ContactPerson1",
                table: "Companies",
                newName: "SecondaryContactPerson");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryContactNo",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryContactPerson",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PrimaryEmail",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNo",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactNo",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PrimaryContactNo",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "PrimaryContactPerson",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "PrimaryEmail",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RegistrationNo",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "SecondaryContactNo",
                table: "Companies");

            migrationBuilder.RenameColumn(
                name: "SecondaryEmail",
                table: "Companies",
                newName: "ContactPerson2");

            migrationBuilder.RenameColumn(
                name: "SecondaryContactPerson",
                table: "Companies",
                newName: "ContactPerson1");
        }
    }
}
