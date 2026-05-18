using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryOrderProofImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                table: "DeliveryOrderProofImage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderProofImage",
                table: "DeliveryOrderProofImage");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderProofImage",
                newName: "DeliveryOrderProofImages");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImages",
                newName: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderProofImages",
                newName: "DeliveryOrderProofImage");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImage",
                newName: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImage",
                table: "DeliveryOrderProofImage",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                table: "DeliveryOrderProofImage",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
