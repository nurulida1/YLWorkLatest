using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSOModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Attachment",
                table: "SalesOrders",
                newName: "ClientPONumber");

            migrationBuilder.AddColumn<string>(
                name: "ClientPOAttachment",
                table: "SalesOrders",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ClientPODate",
                table: "SalesOrders",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientPOAttachment",
                table: "SalesOrders");

            migrationBuilder.DropColumn(
                name: "ClientPODate",
                table: "SalesOrders");

            migrationBuilder.RenameColumn(
                name: "ClientPONumber",
                table: "SalesOrders",
                newName: "Attachment");
        }
    }
}
