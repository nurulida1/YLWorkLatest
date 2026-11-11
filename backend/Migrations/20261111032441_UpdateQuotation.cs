using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQuotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Users_CreatedById",
                table: "Quotations");

            migrationBuilder.AddColumn<int>(
                name: "DocumentVersion",
                table: "Quotations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastGeneratedAt",
                table: "Quotations",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LastGeneratedById",
                table: "Quotations",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<bool>(
                name: "NoValidity",
                table: "Quotations",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "QuotationDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    QuotationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    FileName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FilePath = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ContentType = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, defaultValue: "application/pdf")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Version = table.Column<int>(type: "int", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    GeneratedById = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationDocuments_Quotations_QuotationId",
                        column: x => x.QuotationId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuotationTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Name = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FromCompanyId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Subject = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProjectCode = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Discount = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TaxAmount = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    PaymentTerms = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NoValidity = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Validity = table.Column<int>(type: "int", nullable: true),
                    ValidityType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedById = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationTemplates_Companies_FromCompanyId",
                        column: x => x.FromCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuotationTemplateItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TemplateId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ProductServiceId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    RowType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Item = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    Unit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UnitPrice = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    Discount = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    TotalPrice = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationTemplateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationTemplateItems_QuotationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "QuotationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuotationTemplateTerms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TemplateId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TermsAndConditionId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationTemplateTerms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationTemplateTerms_QuotationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "QuotationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_LastGeneratedById",
                table: "Quotations",
                column: "LastGeneratedById");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_QuotationNo",
                table: "Quotations",
                column: "QuotationNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuotationDocuments_QuotationId",
                table: "QuotationDocuments",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationTemplateItems_TemplateId",
                table: "QuotationTemplateItems",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationTemplates_FromCompanyId",
                table: "QuotationTemplates",
                column: "FromCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationTemplates_Name",
                table: "QuotationTemplates",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationTemplateTerms_TemplateId",
                table: "QuotationTemplateTerms",
                column: "TemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Users_CreatedById",
                table: "Quotations",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Users_LastGeneratedById",
                table: "Quotations",
                column: "LastGeneratedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Users_CreatedById",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Users_LastGeneratedById",
                table: "Quotations");

            migrationBuilder.DropTable(
                name: "QuotationDocuments");

            migrationBuilder.DropTable(
                name: "QuotationTemplateItems");

            migrationBuilder.DropTable(
                name: "QuotationTemplateTerms");

            migrationBuilder.DropTable(
                name: "QuotationTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_LastGeneratedById",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_QuotationNo",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "DocumentVersion",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "LastGeneratedAt",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "LastGeneratedById",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "NoValidity",
                table: "Quotations");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Users_CreatedById",
                table: "Quotations",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
