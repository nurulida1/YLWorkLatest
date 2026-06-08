using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddQtyOnHand : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InventoryId",
                table: "SalesOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<decimal>(
                name: "QtyOnHand",
                table: "SalesOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "Inventories",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "ItemCode",
                table: "Inventories",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "ReservedQuantity",
                table: "Inventories",
                type: "decimal(65,30)",
                nullable: true);

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesOrderItems_Inventories_InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_SalesOrderItems_InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "InventoryId",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "QtyOnHand",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "ItemCode",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "ReservedQuantity",
                table: "Inventories");

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "Inventories",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");
        }
    }
}
