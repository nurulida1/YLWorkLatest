using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class LinkHardwareRequestToProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_HardwareRequests_ProjectId",
                table: "HardwareRequests",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_HardwareRequests_Projects_ProjectId",
                table: "HardwareRequests",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HardwareRequests_Projects_ProjectId",
                table: "HardwareRequests");

            migrationBuilder.DropIndex(
                name: "IX_HardwareRequests_ProjectId",
                table: "HardwareRequests");
        }
    }
}
