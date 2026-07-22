using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuotationsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationItems_QuotationItems_ParentId",
                table: "QuotationItems");

            migrationBuilder.DropIndex(
                name: "IX_QuotationItems_ParentId",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "IsGroup",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "Item",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "TaxRate",
                table: "QuotationItems");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "QuotationItems");

            migrationBuilder.RenameColumn(
                name: "ItemType",
                table: "QuotationItems",
                newName: "HeaderCategory");

            migrationBuilder.AddColumn<string>(
                name: "RowType",
                table: "QuotationItems",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowType",
                table: "QuotationItems");

            migrationBuilder.RenameColumn(
                name: "HeaderCategory",
                table: "QuotationItems",
                newName: "ItemType");

            migrationBuilder.AddColumn<bool>(
                name: "IsGroup",
                table: "QuotationItems",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Item",
                table: "QuotationItems",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "ParentId",
                table: "QuotationItems",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<decimal>(
                name: "TaxRate",
                table: "QuotationItems",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "QuotationItems",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationItems_ParentId",
                table: "QuotationItems",
                column: "ParentId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationItems_QuotationItems_ParentId",
                table: "QuotationItems",
                column: "ParentId",
                principalTable: "QuotationItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
