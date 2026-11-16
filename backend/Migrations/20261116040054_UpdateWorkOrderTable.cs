using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWorkOrderTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "WorkOrderId",
                table: "StaffTasks",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_StaffTasks_WorkOrderId",
                table: "StaffTasks",
                column: "WorkOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_StaffTasks_WorkOrders_WorkOrderId",
                table: "StaffTasks",
                column: "WorkOrderId",
                principalTable: "WorkOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffTasks_WorkOrders_WorkOrderId",
                table: "StaffTasks");

            migrationBuilder.DropIndex(
                name: "IX_StaffTasks_WorkOrderId",
                table: "StaffTasks");

            migrationBuilder.DropColumn(
                name: "WorkOrderId",
                table: "StaffTasks");
        }
    }
}
