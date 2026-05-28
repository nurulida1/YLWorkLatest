using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRoleAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_SystemModules_ModuleId",
                table: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_RolePermissions_ModuleId",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "ModuleId",
                table: "RolePermissions");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_SystemModuleId",
                table: "RolePermissions",
                column: "SystemModuleId");

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_SystemModules_SystemModuleId",
                table: "RolePermissions",
                column: "SystemModuleId",
                principalTable: "SystemModules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_SystemModules_SystemModuleId",
                table: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_RolePermissions_SystemModuleId",
                table: "RolePermissions");

            migrationBuilder.AddColumn<Guid>(
                name: "ModuleId",
                table: "RolePermissions",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_ModuleId",
                table: "RolePermissions",
                column: "ModuleId");

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_SystemModules_ModuleId",
                table: "RolePermissions",
                column: "ModuleId",
                principalTable: "SystemModules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
