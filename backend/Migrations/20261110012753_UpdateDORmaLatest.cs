using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDORmaLatest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_ReceiverCompanyId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_SenderCompanyId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderRMAs_DeliveryOrderId",
                table: "DeliveryOrderRMAs",
                column: "DeliveryOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_ReceiverCompanyId",
                table: "DeliveryOrderRMAs",
                column: "ReceiverCompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_SenderCompanyId",
                table: "DeliveryOrderRMAs",
                column: "SenderCompanyId",
                principalTable: "Companies",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderRMAs_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderRMAs",
                column: "DeliveryOrderId",
                principalTable: "DeliveryOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_ReceiverCompanyId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_SenderCompanyId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderRMAs_DeliveryOrders_DeliveryOrderId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrderRMAs_DeliveryOrderId",
                table: "DeliveryOrderRMAs");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_ReceiverCompanyId",
                table: "DeliveryOrderRMAs",
                column: "ReceiverCompanyId",
                principalTable: "Companies",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderRMAs_Companies_SenderCompanyId",
                table: "DeliveryOrderRMAs",
                column: "SenderCompanyId",
                principalTable: "Companies",
                principalColumn: "Id");
        }
    }
}
