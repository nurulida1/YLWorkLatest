using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class AddPORMA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages");

            migrationBuilder.DropTable(
                name: "RMAItems");

            migrationBuilder.DropTable(
                name: "RMAProofImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages");

            migrationBuilder.DropColumn(
                name: "ReferenceNo",
                table: "DeliveryOrderRMAs");

            migrationBuilder.RenameTable(
                name: "DeliveryOrderProofImages",
                newName: "DeliveryOrderProofImage");

            migrationBuilder.RenameColumn(
                name: "RMANo",
                table: "DeliveryOrderRMAs",
                newName: "DeliveryOrderRMANo");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImage",
                newName: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId");

            migrationBuilder.AddColumn<decimal>(
                name: "ReturnQuantity",
                table: "DeliveryOrderRMAs",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImage",
                table: "DeliveryOrderProofImage",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "DORMAItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    SalesOrderItemId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    DeliveryOrderItemId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Unit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Condition = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DORMAItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DORMAItems_DeliveryOrderRMAs_DeliveryOrderRMAId",
                        column: x => x.DeliveryOrderRMAId,
                        principalTable: "DeliveryOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DORMAProofImage",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Url = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DORMAProofImage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DORMAProofImage_DeliveryOrderRMAs_DeliveryOrderRMAId",
                        column: x => x.DeliveryOrderRMAId,
                        principalTable: "DeliveryOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DORMAStatusHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    RMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ActionUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DORMAStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DORMAStatusHistories_DeliveryOrderRMAs_DeliveryOrderRMAId",
                        column: x => x.DeliveryOrderRMAId,
                        principalTable: "DeliveryOrderRMAs",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PurchaseOrderRMAs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PurchaseOrderRMANo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PurchaseOrderId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    GoodsReceivingId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ReturnType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReturnQuantity = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    ReturnMethod = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ReturnAction = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SenderCompanyId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ReceiverCompanyId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Reason = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ActionUserId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ActionUserName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StatusUpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UpdatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderRMAs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRMAs_Companies_ReceiverCompanyId",
                        column: x => x.ReceiverCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRMAs_Companies_SenderCompanyId",
                        column: x => x.SenderCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PORMAItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PurchaseOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PurchaseOrderItemId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    GoodsReceivedItemId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Quantity = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    Unit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Condition = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PORMAItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PORMAItems_PurchaseOrderRMAs_PurchaseOrderRMAId",
                        column: x => x.PurchaseOrderRMAId,
                        principalTable: "PurchaseOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PORMAProofImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    PurchaseOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Url = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PORMAProofImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PORMAProofImages_PurchaseOrderRMAs_PurchaseOrderRMAId",
                        column: x => x.PurchaseOrderRMAId,
                        principalTable: "PurchaseOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAItems_DeliveryOrderRMAId",
                table: "DORMAItems",
                column: "DeliveryOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAProofImage_DeliveryOrderRMAId",
                table: "DORMAProofImage",
                column: "DeliveryOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_DORMAStatusHistories_DeliveryOrderRMAId",
                table: "DORMAStatusHistories",
                column: "DeliveryOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_PORMAItems_PurchaseOrderRMAId",
                table: "PORMAItems",
                column: "PurchaseOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_PORMAProofImages_PurchaseOrderRMAId",
                table: "PORMAProofImages",
                column: "PurchaseOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRMAs_ReceiverCompanyId",
                table: "PurchaseOrderRMAs",
                column: "ReceiverCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRMAs_SenderCompanyId",
                table: "PurchaseOrderRMAs",
                column: "SenderCompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                table: "DeliveryOrderProofImage",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOrderProofImage_DeliveryOrderStatusHistories_Deliver~",
                table: "DeliveryOrderProofImage");

            migrationBuilder.DropTable(
                name: "DORMAItems");

            migrationBuilder.DropTable(
                name: "DORMAProofImage");

            migrationBuilder.DropTable(
                name: "DORMAStatusHistories");

            migrationBuilder.DropTable(
                name: "PORMAItems");

            migrationBuilder.DropTable(
                name: "PORMAProofImages");

            migrationBuilder.DropTable(
                name: "PurchaseOrderRMAs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeliveryOrderProofImage",
                table: "DeliveryOrderProofImage");

            migrationBuilder.DropColumn(
                name: "ReturnQuantity",
                table: "DeliveryOrderRMAs");

            // migrationBuilder.RenameTable(
            //     name: "DeliveryOrderProofImage",
            //     newName: "DeliveryOrderProofImages");

            migrationBuilder.RenameColumn(
                name: "DeliveryOrderRMANo",
                table: "DeliveryOrderRMAs",
                newName: "RMANo");

            migrationBuilder.RenameIndex(
                name: "IX_DeliveryOrderProofImage_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImages",
                newName: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId");

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNo",
                table: "DeliveryOrderRMAs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeliveryOrderProofImages",
                table: "DeliveryOrderProofImages",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "RMAItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Condition = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Unit = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RMAItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RMAItems_DeliveryOrderRMAs_DeliveryOrderRMAId",
                        column: x => x.DeliveryOrderRMAId,
                        principalTable: "DeliveryOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RMAProofImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderRMAId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Url = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RMAProofImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RMAProofImages_DeliveryOrderRMAs_DeliveryOrderRMAId",
                        column: x => x.DeliveryOrderRMAId,
                        principalTable: "DeliveryOrderRMAs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_RMAItems_DeliveryOrderRMAId",
                table: "RMAItems",
                column: "DeliveryOrderRMAId");

            migrationBuilder.CreateIndex(
                name: "IX_RMAProofImages_DeliveryOrderRMAId",
                table: "RMAProofImages",
                column: "DeliveryOrderRMAId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                table: "DeliveryOrderProofImages",
                column: "DeliveryOrderStatusHistoryId",
                principalTable: "DeliveryOrderStatusHistories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
