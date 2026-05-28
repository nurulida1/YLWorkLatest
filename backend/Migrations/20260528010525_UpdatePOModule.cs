using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePOModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "POClientNo",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "SOClientNo",
                table: "PurchaseOrders");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderId",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_ClientId",
                table: "PurchaseOrders",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Companies_ClientId",
                table: "PurchaseOrders",
                column: "ClientId",
                principalTable: "Companies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Companies_ClientId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_ClientId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "SalesOrderId",
                table: "PurchaseOrders");

            migrationBuilder.AddColumn<string>(
                name: "POClientNo",
                table: "PurchaseOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SOClientNo",
                table: "PurchaseOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
