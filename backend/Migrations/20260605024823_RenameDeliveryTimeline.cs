using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RenameDeliveryTimeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DeliveryTimeline",
                table: "SalesOrders",
                newName: "Execution");

            migrationBuilder.RenameColumn(
                name: "DeliveryTimeline",
                table: "Quotations",
                newName: "Execution");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Execution",
                table: "SalesOrders",
                newName: "DeliveryTimeline");

            migrationBuilder.RenameColumn(
                name: "Execution",
                table: "Quotations",
                newName: "DeliveryTimeline");
        }
    }
}
