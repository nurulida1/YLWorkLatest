using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddContactPersonInDO : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "SalesOrderItems",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactNo1",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactNo2",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson1",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ContactPerson2",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactNo1",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ContactNo2",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ContactPerson1",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ContactPerson2",
                table: "DeliveryOrders");

            migrationBuilder.UpdateData(
                table: "SalesOrderItems",
                keyColumn: "Unit",
                keyValue: null,
                column: "Unit",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "Unit",
                table: "SalesOrderItems",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
