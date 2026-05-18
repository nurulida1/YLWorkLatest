using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePOItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrderItems_ParentId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_ParentId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "IsGroup",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "PurchaseOrderItems");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "PurchaseOrderItems",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Item",
                table: "PurchaseOrderItems",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "Item",
                table: "PurchaseOrderItems");

            migrationBuilder.AddColumn<bool>(
                name: "IsGroup",
                table: "PurchaseOrderItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "PurchaseOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "PurchaseOrderItems",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_ParentId",
                table: "PurchaseOrderItems",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrderItems_ParentId",
                table: "PurchaseOrderItems",
                column: "ParentId",
                principalTable: "PurchaseOrderItems",
                principalColumn: "Id");
        }
    }
}
