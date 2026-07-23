using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTableProofImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DeliveryOrderProofImages was never created in this database (singular table name in use).
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeliveryOrderProofImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeliveryOrderStatusHistoryId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    ImageUrl = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedById = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    UploadedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOrderProofImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOrderProofImages_DeliveryOrderStatusHistories_Delive~",
                        column: x => x.DeliveryOrderStatusHistoryId,
                        principalTable: "DeliveryOrderStatusHistories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrderProofImages_DeliveryOrderStatusHistoryId",
                table: "DeliveryOrderProofImages",
                column: "DeliveryOrderStatusHistoryId");
        }
    }
}
