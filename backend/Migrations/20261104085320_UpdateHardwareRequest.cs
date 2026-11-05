using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateHardwareRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ResponsibleDepartmentId",
                table: "HardwareRequests",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_HardwareRequests_ResponsibleDepartmentId",
                table: "HardwareRequests",
                column: "ResponsibleDepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_HardwareRequests_Departments_ResponsibleDepartmentId",
                table: "HardwareRequests",
                column: "ResponsibleDepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HardwareRequests_Departments_ResponsibleDepartmentId",
                table: "HardwareRequests");

            migrationBuilder.DropIndex(
                name: "IX_HardwareRequests_ResponsibleDepartmentId",
                table: "HardwareRequests");

            migrationBuilder.DropColumn(
                name: "ResponsibleDepartmentId",
                table: "HardwareRequests");
        }
    }
}
