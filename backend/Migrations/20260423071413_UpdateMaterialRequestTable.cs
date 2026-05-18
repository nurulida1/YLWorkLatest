using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMaterialRequestTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialRequests_Companies_SupplierId",
                table: "MaterialRequests");

            migrationBuilder.RenameColumn(
                name: "SupplierId",
                table: "MaterialRequests",
                newName: "RequestedById");

            migrationBuilder.RenameIndex(
                name: "IX_MaterialRequests_SupplierId",
                table: "MaterialRequests",
                newName: "IX_MaterialRequests_RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialRequests_Users_RequestedById",
                table: "MaterialRequests",
                column: "RequestedById",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialRequests_Users_RequestedById",
                table: "MaterialRequests");

            migrationBuilder.RenameColumn(
                name: "RequestedById",
                table: "MaterialRequests",
                newName: "SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_MaterialRequests_RequestedById",
                table: "MaterialRequests",
                newName: "IX_MaterialRequests_SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialRequests_Companies_SupplierId",
                table: "MaterialRequests",
                column: "SupplierId",
                principalTable: "Companies",
                principalColumn: "Id");
        }
    }
}
