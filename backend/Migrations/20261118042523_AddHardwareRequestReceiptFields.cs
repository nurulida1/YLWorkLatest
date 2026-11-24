using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddHardwareRequestReceiptFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedAt",
                table: "HardwareRequests",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReceivedById",
                table: "HardwareRequests",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "ReceivedRemarks",
                table: "HardwareRequests",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_HardwareRequests_ReceivedById",
                table: "HardwareRequests",
                column: "ReceivedById");

            migrationBuilder.AddForeignKey(
                name: "FK_HardwareRequests_Users_ReceivedById",
                table: "HardwareRequests",
                column: "ReceivedById",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HardwareRequests_Users_ReceivedById",
                table: "HardwareRequests");

            migrationBuilder.DropIndex(
                name: "IX_HardwareRequests_ReceivedById",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "ReceivedById",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "ReceivedRemarks",
                table: "HardwareRequests");
        }
    }
}
