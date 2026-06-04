using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDOColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "SubTotal",
                table: "DeliveryOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "DeliveryOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalAmount",
                table: "DeliveryOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "DeliveryOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "DeliveryOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Total",
                table: "DeliveryOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "UnitPrice",
                table: "DeliveryOrderItems",
                type: "decimal(65,30)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "SubTotal",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "TotalAmount",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "TaxRate",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "Total",
                table: "DeliveryOrderItems");

            migrationBuilder.DropColumn(
                name: "UnitPrice",
                table: "DeliveryOrderItems");
        }
    }
}
