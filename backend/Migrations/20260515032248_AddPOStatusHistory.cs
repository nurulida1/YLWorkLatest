using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddPOStatusHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistory_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ActionUserId",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PurchaseOrderStatusHistory",
                table: "PurchaseOrderStatusHistory");

            migrationBuilder.RenameTable(
                name: "PurchaseOrderStatusHistory",
                newName: "PurchaseOrderStatusHistories");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistory_ReviewedByUserId",
                table: "PurchaseOrderStatusHistories",
                newName: "IX_PurchaseOrderStatusHistories_ReviewedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistory_PurchaseOrderId",
                table: "PurchaseOrderStatusHistories",
                newName: "IX_PurchaseOrderStatusHistories_PurchaseOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistory_ActionUserId",
                table: "PurchaseOrderStatusHistories",
                newName: "IX_PurchaseOrderStatusHistories_ActionUserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PurchaseOrderStatusHistories",
                table: "PurchaseOrderStatusHistories",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistories_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderStatusHistories",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistories_Users_ActionUserId",
                table: "PurchaseOrderStatusHistories",
                column: "ActionUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistories_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistories",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistories_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistories_Users_ActionUserId",
                table: "PurchaseOrderStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderStatusHistories_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PurchaseOrderStatusHistories",
                table: "PurchaseOrderStatusHistories");

            migrationBuilder.RenameTable(
                name: "PurchaseOrderStatusHistories",
                newName: "PurchaseOrderStatusHistory");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistories_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory",
                newName: "IX_PurchaseOrderStatusHistory_ReviewedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistories_PurchaseOrderId",
                table: "PurchaseOrderStatusHistory",
                newName: "IX_PurchaseOrderStatusHistory_PurchaseOrderId");

            migrationBuilder.RenameIndex(
                name: "IX_PurchaseOrderStatusHistories_ActionUserId",
                table: "PurchaseOrderStatusHistory",
                newName: "IX_PurchaseOrderStatusHistory_ActionUserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PurchaseOrderStatusHistory",
                table: "PurchaseOrderStatusHistory",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistory_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderStatusHistory",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ActionUserId",
                table: "PurchaseOrderStatusHistory",
                column: "ActionUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderStatusHistory_Users_ReviewedByUserId",
                table: "PurchaseOrderStatusHistory",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
