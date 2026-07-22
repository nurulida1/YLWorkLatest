using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAllTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropForeignKey(
            //     name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
            //     table: "DeliveryOrderProofImage");

            // migrationBuilder.DropForeignKey(
            //     name: "FK_PurchaseOrderItems_Inventories_InventoryId",
            //     table: "PurchaseOrderItems");

            // migrationBuilder.DropIndex(
            //     name: "IX_PurchaseOrderItems_InventoryId",
            //     table: "PurchaseOrderItems");

            // migrationBuilder.DropPrimaryKey(
            //     name: "PK_DeliveryOrderProofImage",
            //     table: "DeliveryOrderProofImage");

            // migrationBuilder.DropColumn(
            //     name: "QuantityOnHand",
            //     table: "SalesOrderItems");

            // migrationBuilder.DropColumn(
            //     name: "QuantityOrdered",
            //     table: "SalesOrderItems");

            // migrationBuilder.DropColumn(
            //     name: "PurchaseOrderId",
            //     table: "PurchaseOrders");

            // migrationBuilder.DropColumn(
            //     name: "InventoryId",
            //     table: "PurchaseOrderItems");

            // migrationBuilder.DropColumn(
            //     name: "Quantity",
            //     table: "ProductServices");

            // migrationBuilder.DropColumn(
            //     name: "ReferenceType",
            //     table: "Inventories");

            // migrationBuilder.RenameTable(
            //     name: "DeliveryOrderProofImage",
            //     newName: "DeliveryOrderProofImages");

            // migrationBuilder.RenameColumn(
            //     name: "QuantityRemaining",
            //     table: "SalesOrderItems",
            //     newName: "QuantityAllocated");

            // migrationBuilder.RenameColumn(
            //     name: "ReferenceId",
            //     table: "Inventories",
            //     newName: "ProductServiceId");

            // migrationBuilder.RenameIndex(
            //     name: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId",
            //     table: "DeliveryOrderProofImages",
            //     newName: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "SalesOrders",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalQuantity",
                table: "PurchaseOrders",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ReceivedQuantity",
                table: "PurchaseOrderItems",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            // migrationBuilder.AddColumn<Guid>(
            //     name: "ProductServiceId",
            //     table: "PurchaseOrderItems",
            //     type: "char(36)",
            //     nullable: false,
            //     defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
            //     collation: "ascii_general_ci");

            migrationBuilder.UpdateData(
                table: "ProductServices",
                keyColumn: "Type",
                keyValue: null,
                column: "Type",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "ProductServices",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            // migrationBuilder.AddColumn<Guid>(
            //     name: "InventoryId",
            //     table: "ProductServices",
            //     type: "char(36)",
            //     nullable: true,
            //     collation: "ascii_general_ci");

            // migrationBuilder.AddColumn<Guid>(
            //     name: "InventoryId1",
            //     table: "ProductServices",
            //     type: "char(36)",
            //     nullable: true,
            //     collation: "ascii_general_ci");

            migrationBuilder.AlterColumn<decimal>(
                name: "ReservedQuantity",
                table: "Inventories",
                type: "decimal(65,30)",
                nullable: true,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Costs",
                table: "Inventories",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StockType",
                table: "Inventories",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsPostedToInventory",
                table: "GoodsReceivings",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "StockTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    InventoryId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Type = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    ReferenceType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReferenceId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockTransactions", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_ProductServiceId",
                table: "PurchaseOrderItems",
                column: "ProductServiceId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductServices_InventoryId1",
                table: "ProductServices",
                column: "InventoryId1");

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ProductServiceId",
                table: "Inventories",
                column: "ProductServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Inventories_ProductServices_ProductServiceId",
                table: "Inventories",
                column: "ProductServiceId",
                principalTable: "ProductServices",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductServices_Inventories_InventoryId1",
                table: "ProductServices",
                column: "InventoryId1",
                principalTable: "Inventories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_ProductServices_ProductServiceId",
                table: "PurchaseOrderItems",
                column: "ProductServiceId",
                principalTable: "ProductServices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Inventories_ProductServices_ProductServiceId",
                table: "Inventories");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductServices_Inventories_InventoryId1",
                table: "ProductServices");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_ProductServices_ProductServiceId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropTable(
                name: "StockTransactions");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderItems_ProductServiceId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductServices_InventoryId1",
                table: "ProductServices");

            migrationBuilder.DropIndex(
                name: "IX_Inventories_ProductServiceId",
                table: "Inventories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages");

            migrationBuilder.DropColumn(
                name: "ProductServiceId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "InventoryId",
                table: "ProductServices");

            migrationBuilder.DropColumn(
                name: "InventoryId1",
                table: "ProductServices");

            migrationBuilder.DropColumn(
                name: "StockType",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "IsPostedToInventory",
                table: "GoodsReceivings");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderProofImages",
                newName: "DeliveryOrderProofImage");

            migrationBuilder.RenameColumn(
                name: "QuantityAllocated",
                table: "SalesOrderItems",
                newName: "QuantityRemaining");

            migrationBuilder.RenameColumn(
                name: "ProductServiceId",
                table: "Inventories",
                newName: "ReferenceId");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImage",
                newName: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "SalesOrders",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityOnHand",
                table: "SalesOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityOrdered",
                table: "SalesOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "TotalQuantity",
                table: "PurchaseOrders",
                type: "int",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AlterColumn<decimal>(
                name: "ReceivedQuantity",
                table: "PurchaseOrderItems",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AddColumn<Guid>(
                name: "InventoryId",
                table: "PurchaseOrderItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "ProductServices",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "Quantity",
                table: "ProductServices",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "ReservedQuantity",
                table: "Inventories",
                type: "decimal(65,30)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)");

            migrationBuilder.AlterColumn<double>(
                name: "Costs",
                table: "Inventories",
                type: "double",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(65,30)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceType",
                table: "Inventories",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImage",
                table: "DeliveryOrderProofImage",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderItems_InventoryId",
                table: "PurchaseOrderItems",
                column: "InventoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                table: "DeliveryOrderProofImage",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_Inventories_InventoryId",
                table: "PurchaseOrderItems",
                column: "InventoryId",
                principalTable: "Inventories",
                principalColumn: "Id");
        }
    }
}
