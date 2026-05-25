using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RemoveReviewedByStatusQuotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationStatusHistories_Users_ReviewedByUserId",
                table: "QuotationStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_QuotationStatusHistories_ReviewedByUserId",
                table: "QuotationStatusHistories");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "QuotationStatusHistories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "QuotationStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationStatusHistories_ReviewedByUserId",
                table: "QuotationStatusHistories",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationStatusHistories_Users_ReviewedByUserId",
                table: "QuotationStatusHistories",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
