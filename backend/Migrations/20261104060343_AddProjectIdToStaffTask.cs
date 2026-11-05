using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectIdToStaffTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "StaffTasks",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_StaffTasks_ProjectId",
                table: "StaffTasks",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_StaffTasks_Projects_ProjectId",
                table: "StaffTasks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffTasks_Projects_ProjectId",
                table: "StaffTasks");

            migrationBuilder.DropIndex(
                name: "IX_StaffTasks_ProjectId",
                table: "StaffTasks");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "StaffTasks");
        }
    }
}
