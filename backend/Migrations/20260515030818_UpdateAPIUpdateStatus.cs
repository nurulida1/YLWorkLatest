using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAPIUpdateStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "PurchaseOrderStatusHistory",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderStatusHistory_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderStatusHistory_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "PurchaseOrderStatusHistory");
        }
    }
}
