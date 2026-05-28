using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSOToDO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DeliveredQuantity",
                table: "SalesOrderItems",
                newName: "QuantityRemaining");

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityDelivered",
                table: "SalesOrderItems",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuantityDelivered",
                table: "SalesOrderItems");

            migrationBuilder.RenameColumn(
                name: "QuantityRemaining",
                table: "SalesOrderItems",
                newName: "DeliveredQuantity");
        }
    }
}
