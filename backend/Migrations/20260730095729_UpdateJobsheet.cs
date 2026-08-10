using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJobsheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("b679279b-7e4c-44c5-93a6-510d77d90ae6"));

            migrationBuilder.AlterColumn<DateTime>(
                name: "WorkDate",
                table: "JobSheets",
                type: "datetime(6)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)");

            migrationBuilder.AddColumn<DateTime>(
                name: "WorkTime",
                table: "JobSheets",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("2f65ff94-43d9-4b30-a427-66d77e4b594e"), null, "", new DateTime(2026, 7, 30, 9, 57, 28, 152, DateTimeKind.Utc).AddTicks(5553), null, "", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("2f65ff94-43d9-4b30-a427-66d77e4b594e"));

            migrationBuilder.DropColumn(
                name: "WorkTime",
                table: "JobSheets");

            migrationBuilder.AlterColumn<DateTime>(
                name: "WorkDate",
                table: "JobSheets",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldNullable: true);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("b679279b-7e4c-44c5-93a6-510d77d90ae6"), null, "", new DateTime(2026, 7, 28, 9, 29, 11, 960, DateTimeKind.Utc).AddTicks(7404), null, "", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }
    }
}
