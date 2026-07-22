using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSOItems1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_Inventories_InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "SalesOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_SalesOrderItems_InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "Execution",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "WarrantyTerms",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "IncludeInDeliveryOrder",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "IsGroup",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "SalesOrderItems");

            migrationBuilder.RenameColumn(
                name: "SalesOrderItemId",
                table: "SalesOrderItems",
                newName: "ProductServiceId");

            migrationBuilder.RenameColumn(
                name: "QtyOnHand",
                table: "SalesOrderItems",
                newName: "QuantityOnHand");

            migrationBuilder.RenameColumn(
                name: "ItemType",
                table: "SalesOrderItems",
                newName: "RowType");

            migrationBuilder.RenameIndex(
                name: "IX_SalesOrderItems_SalesOrderItemId",
                table: "SalesOrderItems",
                newName: "IX_SalesOrderItems_ProductServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderItems_ProductServices_ProductServiceId",
                table: "SalesOrderItems",
                column: "ProductServiceId",
                principalTable: "ProductServices",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_ProductServices_ProductServiceId",
                table: "SalesOrderItems");

            migrationBuilder.RenameColumn(
                name: "RowType",
                table: "SalesOrderItems",
                newName: "ItemType");

            migrationBuilder.RenameColumn(
                name: "QuantityOnHand",
                table: "SalesOrderItems",
                newName: "QtyOnHand");

            migrationBuilder.RenameColumn(
                name: "ProductServiceId",
                table: "SalesOrderItems",
                newName: "SalesOrderItemId");

            migrationBuilder.RenameIndex(
                name: "IX_SalesOrderItems_ProductServiceId",
                table: "SalesOrderItems",
                newName: "IX_SalesOrderItems_SalesOrderItemId");

            migrationBuilder.AddColumn<string>(
                name: "Execution",
                table: "SalesOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "WarrantyTerms",
                table: "SalesOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IncludeInDeliveryOrder",
                table: "SalesOrderItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "InventoryId",
                table: "SalesOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<bool>(
                name: "IsGroup",
                table: "SalesOrderItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "SalesOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "SalesOrderItems",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_SalesOrderItems_InventoryId",
                table: "SalesOrderItems",
                column: "InventoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderItems_Inventories_InventoryId",
                table: "SalesOrderItems",
                column: "InventoryId",
                principalTable: "Inventories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "SalesOrderItems",
                column: "SalesOrderItemId",
                principalTable: "SalesOrderItems",
                principalColumn: "Id");
        }
    }
}
