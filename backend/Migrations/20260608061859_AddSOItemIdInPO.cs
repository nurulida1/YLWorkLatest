using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddSOItemIdInPO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderItemId",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_SalesOrderItemId",
                table: "PurchaseOrderItems",
                column: "SalesOrderItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "PurchaseOrderItems",
                column: "SalesOrderItemId",
                principalTable: "SalesOrderItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_SalesOrderItemId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "SalesOrderItemId",
                table: "PurchaseOrderItems");
        }
    }
}
