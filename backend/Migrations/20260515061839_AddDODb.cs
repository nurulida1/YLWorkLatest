using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddDODb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistory_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderStatusHistory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderStatusHistory",
                table: "DeliveryOrderStatusHistory");

            migrationBuilder.DropColumn(
                name: "ProjectCode",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ProofImageUrls",
                table: "DeliveryOrderStatusHistory");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderStatusHistory",
                newName: "DeliveryOrderStatusHistories");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderStatusHistory_DeliveryOrderId",
                table: "DeliveryOrderStatusHistories",
                newName: "IX_DeliveryOrderStatusHistories_DeliveryOrderId");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "WorkOrderTasks",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "WorkOrderTasks",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "WorkOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "WorkOrderAssignments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "WorkOrderAssignments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Users",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Users",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "SectionInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "SectionInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "RolePermissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "RolePermissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "RMAStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "RMAStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Quotations",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "QuotationItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "QuotationItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Projects",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "ProjectMembers",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "ProjectMembers",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Payments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Payments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Notifications",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Notifications",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "MaterialRequestStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "MaterialRequestStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "MaterialRequests",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "MaterialRequests",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "MaterialItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "MaterialItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "LocationInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "LocationInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Invoices",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "InvoiceItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "InvoiceItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Inventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Incomes",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Incomes",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Expenses",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Expenses",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Departments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Departments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "DeliveryOrders",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Draft",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "Draft")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "DeliveryOrderRMAs",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "DeliveryOrderRMAs",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "DeliveryOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "DeliveryOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Companies",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Companies",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "CategoryInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "CategoryInventories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Attachments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Attachments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Addresses",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "Addresses",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "AccessPermissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "AccessPermissions",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedById",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderStatusHistories",
                table: "DeliveryOrderStatusHistories",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "DeliveryOrderProofImage",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderStatusHistoryId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ImageUrl = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UploadedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UpdatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOrderProofImage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                        column: x => x.DeliveryOrderStatusHistoryId,
                        principalTable: "DeliveryOrderStatusHistories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistories_ActionUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ActionUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImage",
                column: "DeliveryOrderStatusHistoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderStatusHistories",
                column: "DeliveryOrderId",
                principalTable: "DeliveryOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ActionUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ActionUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ActionUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropTable(
                name: "DeliveryOrderProofImage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderStatusHistories",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderStatusHistories_ActionUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "WorkOrderTasks");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "WorkOrderTasks");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "WorkOrderAssignments");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "WorkOrderAssignments");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "SectionInventories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "SectionInventories");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "RolePermissions");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "RMAStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "RMAStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "ProjectMembers");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "MaterialRequestStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "MaterialRequestStatusHistories");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "MaterialRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "MaterialRequests");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "MaterialItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "MaterialItems");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "LocationInventories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "LocationInventories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Incomes");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Incomes");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Departments");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "CategoryInventories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "CategoryInventories");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "AccessPermissions");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "AccessPermissions");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderStatusHistories",
                newName: "DeliveryOrderStatusHistory");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderStatusHistories_DeliveryOrderId",
                table: "DeliveryOrderStatusHistory",
                newName: "IX_DeliveryOrderStatusHistory_DeliveryOrderId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "DeliveryOrders",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "Draft",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Draft")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ProjectCode",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ProofImageUrls",
                table: "DeliveryOrderStatusHistory",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderStatusHistory",
                table: "DeliveryOrderStatusHistory",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistory_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderStatusHistory",
                column: "DeliveryOrderId",
                principalTable: "DeliveryOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
