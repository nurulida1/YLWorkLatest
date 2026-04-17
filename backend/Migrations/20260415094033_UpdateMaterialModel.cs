using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMaterialModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialRequests_Users_RequestedById",
                table: "MaterialRequests");

            migrationBuilder.DropIndex(
                name: "IX_MaterialRequests_RequestedById",
                table: "MaterialRequests");

            migrationBuilder.DropColumn(
                name: "RequestedById",
                table: "MaterialRequests");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RequestedById",
                table: "MaterialRequests",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialRequests_RequestedById",
                table: "MaterialRequests",
                column: "RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialRequests_Users_RequestedById",
                table: "MaterialRequests",
                column: "RequestedById",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
