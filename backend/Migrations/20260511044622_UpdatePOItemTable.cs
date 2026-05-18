using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePOItemTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount",
                table: "PurchaseOrderItems");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                table: "PurchaseOrderItems",
                newName: "TotalPrice");

            migrationBuilder.RenameColumn(
                name: "Item",
                table: "PurchaseOrderItems",
                newName: "Type");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "PurchaseOrderItems",
                type: "decimal(65,30)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PurchaseOrderItems",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "PurchaseOrderItems",
                newName: "Item");

            migrationBuilder.RenameColumn(
                name: "TotalPrice",
                table: "PurchaseOrderItems",
                newName: "TotalAmount");

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "PurchaseOrderItems",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.UpdateData(
                table: "PurchaseOrderItems",
                keyColumn: "Description",
                keyValue: null,
                column: "Description",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "PurchaseOrderItems",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "PurchaseOrderItems",
                type: "decimal(65,30)",
                nullable: true);
        }
    }
}
