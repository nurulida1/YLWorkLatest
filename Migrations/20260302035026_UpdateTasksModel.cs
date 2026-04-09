using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTasksModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_Users_AssignedToId",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_AssignedToId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "AssignedToId",
                table: "ProjectTasks");

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectTaskId",
                table: "Users",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ProjectTaskId",
                table: "Users",
                column: "ProjectTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_ProjectTasks_ProjectTaskId",
                table: "Users",
                column: "ProjectTaskId",
                principalTable: "ProjectTasks",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_ProjectTasks_ProjectTaskId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_ProjectTaskId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProjectTaskId",
                table: "Users");

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToId",
                table: "ProjectTasks",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_AssignedToId",
                table: "ProjectTasks",
                column: "AssignedToId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_Users_AssignedToId",
                table: "ProjectTasks",
                column: "AssignedToId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
