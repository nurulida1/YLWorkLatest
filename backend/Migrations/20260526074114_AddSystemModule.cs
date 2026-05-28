using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_SystemModule_ModuleId",
                table: "RolePermissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SystemModule",
                table: "SystemModule");

            migrationBuilder.RenameTable(
                name: "SystemModule",
                newName: "SystemModules");

            migrationBuilder.AddColumn<string>(
                name: "TotalInWords",
                table: "PurchaseOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SystemModules",
                table: "SystemModules",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_SystemModules_ModuleId",
                table: "RolePermissions",
                column: "ModuleId",
                principalTable: "SystemModules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_SystemModules_ModuleId",
                table: "RolePermissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SystemModules",
                table: "SystemModules");

            migrationBuilder.DropColumn(
                name: "TotalInWords",
                table: "PurchaseOrders");

            migrationBuilder.RenameTable(
                name: "SystemModules",
                newName: "SystemModule");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SystemModule",
                table: "SystemModule",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_SystemModule_ModuleId",
                table: "RolePermissions",
                column: "ModuleId",
                principalTable: "SystemModule",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
