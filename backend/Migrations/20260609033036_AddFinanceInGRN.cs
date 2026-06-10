using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceInGRN : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "GoodsReceivings",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Gross",
                table: "GoodsReceivings",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "GoodsReceivings",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "GoodsReceivingItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalPrice",
                table: "GoodsReceivingItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Unit",
                table: "GoodsReceivingItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPrice",
                table: "GoodsReceivingItems",
                type: "decimal(65,30)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount",
                table: "GoodsReceivings");

            migrationBuilder.DropColumn(
                name: "Gross",
                table: "GoodsReceivings");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "GoodsReceivings");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "GoodsReceivingItems");

            migrationBuilder.DropColumn(
                name: "TotalPrice",
                table: "GoodsReceivingItems");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "GoodsReceivingItems");

            migrationBuilder.DropColumn(
                name: "UnitPrice",
                table: "GoodsReceivingItems");
        }
    }
}
