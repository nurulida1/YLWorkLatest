using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddNoValidityToQuotationTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "QuotationTemplates",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationTemplates_CreatedById",
                table: "QuotationTemplates",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationTemplates_Users_CreatedById",
                table: "QuotationTemplates",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationTemplates_Users_CreatedById",
                table: "QuotationTemplates");

            migrationBuilder.DropIndex(
                name: "IX_QuotationTemplates_CreatedById",
                table: "QuotationTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "QuotationTemplates");
        }
    }
}
