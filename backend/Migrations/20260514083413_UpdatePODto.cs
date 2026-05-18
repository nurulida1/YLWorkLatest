using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePODto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FromCompanyId",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_FromCompanyId",
                table: "PurchaseOrders",
                column: "FromCompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_FromCompanyId",
                table: "PurchaseOrders",
                column: "FromCompanyId",
                principalTable: "Companies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_FromCompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_FromCompanyId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "FromCompanyId",
                table: "PurchaseOrders");
        }
    }
}
