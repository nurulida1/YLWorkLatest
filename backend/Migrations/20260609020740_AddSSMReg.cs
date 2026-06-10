using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddSSMReg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "InventoryId",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "SSMRegNo",
                table: "Companies",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_InventoryId",
                table: "PurchaseOrderItems",
                column: "InventoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_Inventories_InventoryId",
                table: "PurchaseOrderItems",
                column: "InventoryId",
                principalTable: "Inventories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_Inventories_InventoryId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_InventoryId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "InventoryId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "SSMRegNo",
                table: "Companies");
        }
    }
}
