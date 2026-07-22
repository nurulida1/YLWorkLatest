using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuotesItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProductServiceId",
                table: "QuotationItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationItems_ProductServiceId",
                table: "QuotationItems",
                column: "ProductServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationItems_ProductServices_ProductServiceId",
                table: "QuotationItems",
                column: "ProductServiceId",
                principalTable: "ProductServices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationItems_ProductServices_ProductServiceId",
                table: "QuotationItems");

            migrationBuilder.DropIndex(
                name: "IX_QuotationItems_ProductServiceId",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "ProductServiceId",
                table: "QuotationItems");
        }
    }
}
