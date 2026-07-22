using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YLWorks.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProjectTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DORMAProofImage_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAProofImage");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_Projects_ProjectId",
                table: "ProjectTasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DORMAProofImage",
                table: "DORMAProofImage");

            migrationBuilder.RenameTable(
                name: "DORMAProofImage",
                newName: "DORMAProofImages");

            migrationBuilder.RenameColumn(
                name: "Item",
                table: "ProjectTaskChecklists",
                newName: "Title");

            migrationBuilder.RenameIndex(
                name: "IX_DORMAProofImage_DeliveryOrderRMAId",
                table: "DORMAProofImages",
                newName: "IX_DORMAProofImages_DeliveryOrderRMAId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DORMAProofImages",
                table: "DORMAProofImages",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAProofImages_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAProofImages",
                column: "DeliveryOrderRMAId",
                principalTable: "DeliveryOrderRMAs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_Projects_ProjectId",
                table: "ProjectTasks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DORMAProofImages_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAProofImages");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_Projects_ProjectId",
                table: "ProjectTasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DORMAProofImages",
                table: "DORMAProofImages");

            migrationBuilder.RenameTable(
                name: "DORMAProofImages",
                newName: "DORMAProofImage");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "ProjectTaskChecklists",
                newName: "Item");

            migrationBuilder.RenameIndex(
                name: "IX_DORMAProofImages_DeliveryOrderRMAId",
                table: "DORMAProofImage",
                newName: "IX_DORMAProofImage_DeliveryOrderRMAId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DORMAProofImage",
                table: "DORMAProofImage",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_DORMAProofImage_DeliveryOrderRMAs_DeliveryOrderRMAId",
                table: "DORMAProofImage",
                column: "DeliveryOrderRMAId",
                principalTable: "DeliveryOrderRMAs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_Projects_ProjectId",
                table: "ProjectTasks",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id");
        }
    }
}
