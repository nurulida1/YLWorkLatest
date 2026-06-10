using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryIdInPOItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_SalesOrderId",
                table: "PurchaseOrders",
                column: "SalesOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_SalesOrders_SalesOrderId",
                table: "PurchaseOrders",
                column: "SalesOrderId",
                principalTable: "SalesOrders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_SalesOrders_SalesOrderId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_SalesOrderId",
                table: "PurchaseOrders");
        }
    }
}
