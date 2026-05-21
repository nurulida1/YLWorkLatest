using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInvoiceTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Incomes_IncomeId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Users_UploadedById",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_WorkOrderTasks_WorkOrderTaskId",
                table: "Attachments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Attachments",
                table: "Attachments");

            migrationBuilder.RenameTable(
                name: "Attachments",
                newName: "AttachmentDto");

            migrationBuilder.RenameIndex(
                name: "IX_Attachments_WorkOrderTaskId",
                table: "AttachmentDto",
                newName: "IX_AttachmentDto_WorkOrderTaskId");

            migrationBuilder.RenameIndex(
                name: "IX_Attachments_UploadedById",
                table: "AttachmentDto",
                newName: "IX_AttachmentDto_UploadedById");

            migrationBuilder.RenameIndex(
                name: "IX_Attachments_IncomeId",
                table: "AttachmentDto",
                newName: "IX_AttachmentDto_IncomeId");

            migrationBuilder.AddColumn<Guid>(
                name: "CompanyId",
                table: "Invoices",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AttachmentDto",
                table: "AttachmentDto",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CompanyId",
                table: "Invoices",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttachmentDto_Incomes_IncomeId",
                table: "AttachmentDto",
                column: "IncomeId",
                principalTable: "Incomes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AttachmentDto_Users_UploadedById",
                table: "AttachmentDto",
                column: "UploadedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AttachmentDto_WorkOrderTasks_WorkOrderTaskId",
                table: "AttachmentDto",
                column: "WorkOrderTaskId",
                principalTable: "WorkOrderTasks",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttachmentDto_Incomes_IncomeId",
                table: "AttachmentDto");

            migrationBuilder.DropForeignKey(
                name: "FK_AttachmentDto_Users_UploadedById",
                table: "AttachmentDto");

            migrationBuilder.DropForeignKey(
                name: "FK_AttachmentDto_WorkOrderTasks_WorkOrderTaskId",
                table: "AttachmentDto");

            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Companies_CompanyId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_CompanyId",
                table: "Invoices");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AttachmentDto",
                table: "AttachmentDto");

            migrationBuilder.DropColumn(
                name: "CompanyId",
                table: "Invoices");

            migrationBuilder.RenameTable(
                name: "AttachmentDto",
                newName: "Attachments");

            migrationBuilder.RenameIndex(
                name: "IX_AttachmentDto_WorkOrderTaskId",
                table: "Attachments",
                newName: "IX_Attachments_WorkOrderTaskId");

            migrationBuilder.RenameIndex(
                name: "IX_AttachmentDto_UploadedById",
                table: "Attachments",
                newName: "IX_Attachments_UploadedById");

            migrationBuilder.RenameIndex(
                name: "IX_AttachmentDto_IncomeId",
                table: "Attachments",
                newName: "IX_Attachments_IncomeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Attachments",
                table: "Attachments",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Incomes_IncomeId",
                table: "Attachments",
                column: "IncomeId",
                principalTable: "Incomes",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Users_UploadedById",
                table: "Attachments",
                column: "UploadedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_WorkOrderTasks_WorkOrderTaskId",
                table: "Attachments",
                column: "WorkOrderTaskId",
                principalTable: "WorkOrderTasks",
                principalColumn: "Id");
        }
    }
}
