using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAllFinancialItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "SalesOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SubTotal",
                table: "SalesOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "SalesOrders",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "SalesOrderItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "Quotations",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SubTotal",
                table: "Quotations",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "Quotations",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "QuotationItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "QuotationItems",
                type: "decimal(65,30)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "SubTotal",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "TaxRate",
                table: "SalesOrderItems");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "SubTotal",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Discount",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "TaxRate",
                table: "QuotationItems");

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
    }
}
