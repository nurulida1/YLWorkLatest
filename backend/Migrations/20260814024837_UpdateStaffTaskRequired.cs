using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStaffTaskRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffTasks_Users_AssignedToId",
                table: "StaffTasks");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d81d7492-c509-493e-be1d-6ff96030335c"));

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedToId",
                table: "StaffTasks",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("68315fb8-5429-4fe2-b42c-cf0139881944"), null, "", new DateTime(2026, 8, 14, 2, 48, 36, 441, DateTimeKind.Utc).AddTicks(450), null, "Super Admin", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });

            migrationBuilder.AddForeignKey(
                name: "FK_StaffTasks_Users_AssignedToId",
                table: "StaffTasks",
                column: "AssignedToId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffTasks_Users_AssignedToId",
                table: "StaffTasks");

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("68315fb8-5429-4fe2-b42c-cf0139881944"));

            migrationBuilder.AlterColumn<Guid>(
                name: "AssignedToId",
                table: "StaffTasks",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("d81d7492-c509-493e-be1d-6ff96030335c"), null, "", new DateTime(2026, 8, 11, 1, 4, 49, 968, DateTimeKind.Utc).AddTicks(7202), null, "Super Admin", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });

            migrationBuilder.AddForeignKey(
                name: "FK_StaffTasks_Users_AssignedToId",
                table: "StaffTasks",
                column: "AssignedToId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
