using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDOStatusHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistories_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistories_ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ReviewByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ApprovedByUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ReviewByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ReviewByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderStatusHistories_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderStatusHistories_ReviewByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "ReviewByUserId",
                table: "DeliveryOrderStatusHistories");
        }
    }
}
