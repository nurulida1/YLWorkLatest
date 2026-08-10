using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJobsheet1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("2f65ff94-43d9-4b30-a427-66d77e4b594e"));

            migrationBuilder.RenameColumn(
                name: "WorkTime",
                table: "JobSheets",
                newName: "StartTime");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndTime",
                table: "JobSheets",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("7671b7dd-6296-4580-b95b-108ad196ddde"), null, "", new DateTime(2026, 7, 31, 0, 51, 24, 26, DateTimeKind.Utc).AddTicks(6029), null, "Super Admin", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("7671b7dd-6296-4580-b95b-108ad196ddde"));

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "JobSheets");

            migrationBuilder.RenameColumn(
                name: "StartTime",
                table: "JobSheets",
                newName: "WorkTime");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessPermission", "ContactNo", "CreatedAt", "CreatedById", "DisplayName", "Email", "EmployeeNo", "FullName", "Gender", "IsActive", "JobTitle", "JoinedDate", "LastLoginAt", "ManagerId", "Password", "RefreshToken", "RefreshTokenExpiryTime", "RejectReason", "Status", "SystemRole", "UpdatedAt", "UpdatedById" },
                values: new object[] { new Guid("2f65ff94-43d9-4b30-a427-66d77e4b594e"), null, "", new DateTime(2026, 7, 30, 9, 57, 28, 152, DateTimeKind.Utc).AddTicks(5553), null, "", "superAdmin@test.com", "ADMIN001", "Super Admin", null, true, null, null, null, null, "AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==", null, null, null, "Approved", "SuperAdmin", null, null });
        }
    }
}
