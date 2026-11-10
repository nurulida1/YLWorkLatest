using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDORma : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DORMAStatusHistories_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DORMAStatusHistories_DeliveryOrderRMAId",
                table: "DORMAStatusHistories");

            migrationBuilder.DropColumn(
                name: "DeliveryOrderRMAId",
                table: "DORMAStatusHistories");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "DORMAItems",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryOrderRMANo",
                table: "DeliveryOrderRMAs",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAStatusHistories_RMAId",
                table: "DORMAStatusHistories",
                column: "RMAId");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAItems_DeliveryOrderItemId",
                table: "DORMAItems",
                column: "DeliveryOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAItems_SalesOrderItemId",
                table: "DORMAItems",
                column: "SalesOrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderRMAs_DeliveryOrderRMANo",
                table: "DeliveryOrderRMAs",
                column: "DeliveryOrderRMANo",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAItems_DeliveryOrderItems_DeliveryOrderItemId",
                table: "DORMAItems",
                column: "DeliveryOrderItemId",
                principalTable: "DeliveryOrderItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAItems_SalesOrderItems_SalesOrderItemId",
                table: "DORMAItems",
                column: "SalesOrderItemId",
                principalTable: "SalesOrderItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAStatusHistories_DeliveryOrderRMAs_RMAId",
                table: "DORMAStatusHistories",
                column: "RMAId",
                principalTable: "DeliveryOrderRMAs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DORMAItems_DeliveryOrderItems_DeliveryOrderItemId",
                table: "DORMAItems");

            migrationBuilder.DropForeignKey(
                name: "FK_DORMAItems_SalesOrderItems_SalesOrderItemId",
                table: "DORMAItems");

            migrationBuilder.DropForeignKey(
                name: "FK_DORMAStatusHistories_DeliveryOrderRMAs_RMAId",
                table: "DORMAStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DORMAStatusHistories_RMAId",
                table: "DORMAStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_DORMAItems_DeliveryOrderItemId",
                table: "DORMAItems");

            migrationBuilder.DropIndex(
                name: "IX_DORMAItems_SalesOrderItemId",
                table: "DORMAItems");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderRMAs_DeliveryOrderRMANo",
                table: "DeliveryOrderRMAs");

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryOrderRMAId",
                table: "DORMAStatusHistories",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "DORMAItems",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryOrderRMANo",
                table: "DeliveryOrderRMAs",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAStatusHistories_DeliveryOrderRMAId",
                table: "DORMAStatusHistories",
                column: "DeliveryOrderRMAId");

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAStatusHistories_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAStatusHistories",
                column: "DeliveryOrderRMAId",
                principalTable: "DeliveryOrderRMAs",
                principalColumn: "Id");
        }
    }
}
