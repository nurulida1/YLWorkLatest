using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddGRNIdInInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Invoices",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceivingId",
                table: "Invoices",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceivingItemId",
                table: "InvoiceItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_GoodsReceivingId",
                table: "Invoices",
                column: "GoodsReceivingId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_GoodsReceivingItemId",
                table: "InvoiceItems",
                column: "GoodsReceivingItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_GoodsReceivingItems_GoodsReceivingItemId",
                table: "InvoiceItems",
                column: "GoodsReceivingItemId",
                principalTable: "GoodsReceivingItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_GoodsReceivings_GoodsReceivingId",
                table: "Invoices",
                column: "GoodsReceivingId",
                principalTable: "GoodsReceivings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_GoodsReceivingItems_GoodsReceivingItemId",
                table: "InvoiceItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_GoodsReceivings_GoodsReceivingId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_GoodsReceivingId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_GoodsReceivingItemId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "GoodsReceivingId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "GoodsReceivingItemId",
                table: "InvoiceItems");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Invoices",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");
        }
    }
}
