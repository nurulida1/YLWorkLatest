using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStatusHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrders_Users_ApprovedById",
                table: "DeliveryOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrders_Users_PreparedById",
                table: "DeliveryOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Users_CreatedById",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Users_OrderedById",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Users_ApprovedById",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Users_CreatedById",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_ApprovedById",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_CreatedById",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_CreatedById",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_OrderedById",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrders_ApprovedById",
                table: "DeliveryOrders");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOrders_PreparedById",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ApprovedById",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "SignatureImage",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "OrderDate",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "OrderedById",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "SignatureImage",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ApprovedById",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "IssuedAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "IssuedRemarks",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "OnDeliveryAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "PreparedAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "PreparedById",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "PreparedByUserId",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ProofImage",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ReceivedAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ReceivedBy",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "SignatureImage",
                table: "DeliveryOrders");

            migrationBuilder.DropColumn(
                name: "TrackingNo",
                table: "DeliveryOrders");

            migrationBuilder.CreateTable(
                name: "DeliveryOrderStatusHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ActionUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SignatureImage = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProofImageUrls = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TrackingNo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOrderStatusHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOrderStatusHistory_DeliveryOrders_DeliveryOrderId",
                        column: x => x.DeliveryOrderId,
                        principalTable: "DeliveryOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PurchaseOrderStatusHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PurchaseOrderId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ActionUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SignatureImage = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderStatusHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderStatusHistory_PurchaseOrders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderStatusHistory_Users_ActionUserId",
                        column: x => x.ActionUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuotationStatusHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    QuotationId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ActionUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SignatureImage = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationStatusHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationStatusHistory_Quotations_QuotationId",
                        column: x => x.QuotationId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuotationStatusHistory_Users_ActionUserId",
                        column: x => x.ActionUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderStatusHistory_DeliveryOrderId",
                table: "DeliveryOrderStatusHistory",
                column: "DeliveryOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderStatusHistory_ActionUserId",
                table: "PurchaseOrderStatusHistory",
                column: "ActionUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderStatusHistory_PurchaseOrderId",
                table: "PurchaseOrderStatusHistory",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationStatusHistory_ActionUserId",
                table: "QuotationStatusHistory",
                column: "ActionUserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationStatusHistory_QuotationId",
                table: "QuotationStatusHistory",
                column: "QuotationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryOrderStatusHistory");

            migrationBuilder.DropTable(
                name: "PurchaseOrderStatusHistory");

            migrationBuilder.DropTable(
                name: "QuotationStatusHistory");

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedById",
                table: "Quotations",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "Quotations",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Quotations",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "Quotations",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "SignatureImage",
                table: "Quotations",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<DateTime>(
                name: "OrderDate",
                table: "PurchaseOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrderedById",
                table: "PurchaseOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "SignatureImage",
                table: "PurchaseOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedById",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<DateTime>(
                name: "IssuedAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssuedRemarks",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "OnDeliveryAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreparedAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PreparedById",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "PreparedByUserId",
                table: "DeliveryOrders",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.AddColumn<string>(
                name: "ProofImage",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReceivedBy",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "DeliveryOrders",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignatureImage",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "TrackingNo",
                table: "DeliveryOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_ApprovedById",
                table: "Quotations",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_CreatedById",
                table: "Quotations",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CreatedById",
                table: "PurchaseOrders",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_OrderedById",
                table: "PurchaseOrders",
                column: "OrderedById");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrders_ApprovedById",
                table: "DeliveryOrders",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrders_PreparedById",
                table: "DeliveryOrders",
                column: "PreparedById");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrders_Users_ApprovedById",
                table: "DeliveryOrders",
                column: "ApprovedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrders_Users_PreparedById",
                table: "DeliveryOrders",
                column: "PreparedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Users_CreatedById",
                table: "PurchaseOrders",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Users_OrderedById",
                table: "PurchaseOrders",
                column: "OrderedById",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Users_ApprovedById",
                table: "Quotations",
                column: "ApprovedById",
                principalTable: "Users",
                principalColumn: "Id");

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
