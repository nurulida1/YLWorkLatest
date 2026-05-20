using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Expenses_ExpenseId",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_ExpenseId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "ExpenseId",
                table: "Attachments");

            migrationBuilder.AddColumn<string>(
                name: "Attachment",
                table: "Expenses",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Attachment",
                table: "Expenses");

            migrationBuilder.AddColumn<Guid>(
                name: "ExpenseId",
                table: "Attachments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_ExpenseId",
                table: "Attachments",
                column: "ExpenseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Expenses_ExpenseId",
                table: "Attachments",
                column: "ExpenseId",
                principalTable: "Expenses",
                principalColumn: "Id");
        }
    }
}
