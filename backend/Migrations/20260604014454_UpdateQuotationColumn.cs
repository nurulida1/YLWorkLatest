using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuotationColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TermsAndConditions",
                table: "Quotations",
                newName: "WarrantyTerms");

            migrationBuilder.RenameColumn(
                name: "ReferenceNo",
                table: "Quotations",
                newName: "PaymentTerms");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryTimeline",
                table: "Quotations",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ValidityDays",
                table: "Quotations",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryTimeline",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ValidityDays",
                table: "Quotations");

            migrationBuilder.RenameColumn(
                name: "WarrantyTerms",
                table: "Quotations",
                newName: "TermsAndConditions");

            migrationBuilder.RenameColumn(
                name: "PaymentTerms",
                table: "Quotations",
                newName: "ReferenceNo");
        }
    }
}
