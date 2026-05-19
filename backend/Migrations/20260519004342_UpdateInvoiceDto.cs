using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInvoiceDto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Invoices_InvoiceId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Users_CreatedById",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_InvoiceId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Attachments");

            migrationBuilder.RenameColumn(
                name: "ProjectCode",
                table: "Invoices",
                newName: "Terms");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Invoices",
                newName: "Attachment");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                table: "InvoiceItems",
                newName: "Amount");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "Invoices",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Users_CreatedById",
                table: "Invoices",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Users_CreatedById",
                table: "Invoices");

            migrationBuilder.RenameColumn(
                name: "Terms",
                table: "Invoices",
                newName: "ProjectCode");

            migrationBuilder.RenameColumn(
                name: "Attachment",
                table: "Invoices",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "InvoiceItems",
                newName: "TotalAmount");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedById",
                table: "Invoices",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Attachments",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_InvoiceId",
                table: "Attachments",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Invoices_InvoiceId",
                table: "Attachments",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Users_CreatedById",
                table: "Invoices",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
