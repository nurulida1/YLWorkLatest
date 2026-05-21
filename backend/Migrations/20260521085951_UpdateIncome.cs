using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIncome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttachmentDto_Incomes_IncomeId",
                table: "AttachmentDto");

            migrationBuilder.DropIndex(
                name: "IX_AttachmentDto_IncomeId",
                table: "AttachmentDto");

            migrationBuilder.DropColumn(
                name: "IncomeId",
                table: "AttachmentDto");

            migrationBuilder.RenameColumn(
                name: "PaymentMethod",
                table: "Incomes",
                newName: "PaymentMode");

            migrationBuilder.AddColumn<string>(
                name: "Attachment",
                table: "Incomes",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Attachment",
                table: "Incomes");

            migrationBuilder.RenameColumn(
                name: "PaymentMode",
                table: "Incomes",
                newName: "PaymentMethod");

            migrationBuilder.AddColumn<Guid>(
                name: "IncomeId",
                table: "AttachmentDto",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_AttachmentDto_IncomeId",
                table: "AttachmentDto",
                column: "IncomeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttachmentDto_Incomes_IncomeId",
                table: "AttachmentDto",
                column: "IncomeId",
                principalTable: "Incomes",
                principalColumn: "Id");
        }
    }
}
