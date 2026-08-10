using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJobsheet2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("7671b7dd-6296-4580-b95b-108ad196ddde"));

            migrationBuilder.DropColumn(
                name: "HoursWorked",
                table: "JobSheetMembers");

            migrationBuilder.DropColumn(
                name: "IsLeader",
                table: "JobSheetMembers");

            migrationBuilder.AlterColumn<string>(
                name: "WorkDescription",
                table: "JobSheets",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("3d37f1b9-728e-4249-a4bd-3628cba9a133"), null, "", new DateTime(2026, 7, 31, 1, 56, 19, 37, DateTimeKind.Utc).AddTicks(8087), null, "Super Admin", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("3d37f1b9-728e-4249-a4bd-3628cba9a133"));

            migrationBuilder.UpdateData(
                table: "JobSheets",
                keyColumn: "WorkDescription",
                keyValue: null,
                column: "WorkDescription",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "WorkDescription",
                table: "JobSheets",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "HoursWorked",
                table: "JobSheetMembers",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsLeader",
                table: "JobSheetMembers",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("7671b7dd-6296-4580-b95b-108ad196ddde"), null, "", new DateTime(2026, 7, 31, 0, 51, 24, 26, DateTimeKind.Utc).AddTicks(6029), null, "Super Admin", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }
    }
}
