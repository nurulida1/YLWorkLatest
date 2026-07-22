using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateGRNCompId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "GoodsReceivings",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceivings_CompanyId",
                table: "GoodsReceivings",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceivings_Companies_CompanyId",
                table: "GoodsReceivings",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoodsReceivings_Companies_CompanyId",
                table: "GoodsReceivings");

            migrationBuilder.DropIndex(
                name: "IX_GoodsReceivings_CompanyId",
                table: "GoodsReceivings");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "GoodsReceivings");
        }
    }
}
