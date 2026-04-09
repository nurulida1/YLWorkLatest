using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTasksModel2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ProjectTasks",
                newName: "TaskNo");

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                table: "ProjectTasks",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JobTitle",
                table: "ProjectTasks");

            migrationBuilder.RenameColumn(
                name: "TaskNo",
                table: "ProjectTasks",
                newName: "Name");
        }
    }
}
