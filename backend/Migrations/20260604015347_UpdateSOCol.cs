using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSOCol : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Terms",
                table: "SalesOrders",
                newName: "WarrantyTerms");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryTimeline",
                table: "SalesOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "SalesOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryTimeline",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "SalesOrders");

            migrationBuilder.RenameColumn(
                name: "WarrantyTerms",
                table: "SalesOrders",
                newName: "Terms");
        }
    }
}
