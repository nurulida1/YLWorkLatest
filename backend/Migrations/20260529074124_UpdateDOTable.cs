using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDOTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrders_PurchaseOrders_PurchaseOrderId",
                table: "DeliveryOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ReviewByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderStatusHistories_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderStatusHistories_ReviewByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrders_PurchaseOrderId",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "ReviewByUserId",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "SignatureImage",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "TrackingNo",
                table: "DeliveryOrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "DeliveryOrders");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsReceiverSigned",
                table: "DeliveryOrders",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReceivedBy",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverSignatureImage",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TrackingNo",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderItemId",
                table: "DeliveryOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderItems_SalesOrderItemId",
                table: "DeliveryOrderItems",
                column: "SalesOrderItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "DeliveryOrderItems",
                column: "SalesOrderItemId",
                principalTable: "SalesOrderItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderItems_SalesOrderItems_SalesOrderItemId",
                table: "DeliveryOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderItems_SalesOrderItemId",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "IsReceiverSigned",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ReceivedBy",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ReceiverSignatureImage",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "TrackingNo",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "SalesOrderItemId",
                table: "DeliveryOrderItems");

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "SignatureImage",
                table: "DeliveryOrderStatusHistories",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TrackingNo",
                table: "DeliveryOrderStatusHistories",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
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

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistories_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistories_ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ReviewByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrders_PurchaseOrderId",
                table: "DeliveryOrders",
                column: "PurchaseOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrders_PurchaseOrders_PurchaseOrderId",
                table: "DeliveryOrders",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ApprovedByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ApprovedByUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderStatusHistories_Users_ReviewByUserId",
                table: "DeliveryOrderStatusHistories",
                column: "ReviewByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
