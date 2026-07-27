using Microsoft.EntityFrameworkCore;
using YLWorks.Model;
using YLWorks.Model.Leave;

namespace YLWorks.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // =======================
        // SECURITY / ACCESS
        // =======================
        public DbSet<User> Users { get; set; }
        public DbSet<UserReportingManager> UserReportingManagers { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<AccessPermission> AccessPermissions { get; set; }
        public DbSet<SystemModule> SystemModules { get; set; }

        public DbSet<ActivityLog> ActivityLogs { get; set; }

        // =======================
        // LEAVE MANAGEMENT
        // =======================
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<LeaveBalance> LeaveBalances { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<LeaveApproval> LeaveApprovals { get; set; }
        public DbSet<LeaveCancellation> LeaveCancellations { get; set; }
        public DbSet<LeaveConflictCheck> LeaveConflictChecks { get; set; }
        public DbSet<LeaveBalanceCheckRecord> LeaveBalanceCheckRecords { get; set; }
        public DbSet<LeaveSupportingDocument> LeaveSupportingDocuments { get; set; }
        public DbSet<LeaveAppeal> LeaveAppeals { get; set; }
        public DbSet<LeavePolicy> LeavePolicies { get; set; }
        public DbSet<LeaveTenureBand> LeaveTenureBands { get; set; }
        public DbSet<LeaveYearClose> LeaveYearCloses { get; set; }
        public DbSet<LeaveCalendarConnection> LeaveCalendarConnections { get; set; }
        public DbSet<LeaveCalendarEventMap> LeaveCalendarEventMaps { get; set; }

        // =======================
        // ORGANIZATION
        // =======================
        public DbSet<Department> Departments { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }

        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<ProjectTaskAssignment> ProjectTaskAssignments { get; set; }
        public DbSet<ProjectTaskAttachment> ProjectTaskAttachments { get; set; }
        public DbSet<ProjectTaskChecklist> ProjectTaskChecklists { get; set; }

        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<WorkOrderTask> WorkOrderTasks { get; set; }
        public DbSet<WorkOrderAssignment> WorkOrderAssignments { get; set; }

        public DbSet<DeliveryOrder> DeliveryOrders { get; set; }
        public DbSet<DeliveryOrderItem> DeliveryOrderItems { get; set; }
        public DbSet<DeliveryOrderStatusHistory> DeliveryOrderStatusHistories { get; set; }
        //public DbSet<DeliveryOrderProofImage> DeliveryOrderProofImages { get; set; }
        public DbSet<DORMAProofImage> DORMAProofImages { get; set; }
        public DbSet<DORMAStatusHistory> DORMAStatusHistories { get; set; }

        public DbSet<DeliveryOrderRMA> DeliveryOrderRMAs { get; set; }
        public DbSet<DORMAItem> DORMAItems { get; set; }

        public DbSet<PurchaseOrderRMA> PurchaseOrderRMAs { get; set; }
        public DbSet<PORMAItem> PORMAItems { get; set; }
        public DbSet<PORMAProofImage> PORMAProofImages { get; set; }

        public DbSet<SectionInventory> SectionInventories { get; set; }
        public DbSet<CategoryInventory> CategoryInventories { get; set; }
        public DbSet<LocationInventory> LocationInventories { get; set; }


        // =======================
        // MASTER DATA
        // =======================
        public DbSet<Company> Companies { get; set; }
        public DbSet<Address> Addresses { get; set; }

        // =======================
        // SALES / PROCUREMENT
        // =======================
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItems> QuotationItems { get; set; }
        public DbSet<QuotationStatusHistory> QuotationStatusHistories { get; set; }
        public DbSet<QuotationTermsAndCondition> QuotationTermsAndConditions { get; set; }
        public DbSet<QuotationOtherInformation> QuotationOtherInformations { get; set; }

        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<PurchaseOrderStatusHistory> PurchaseOrderStatusHistories { get; set; }

        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
        public DbSet<SalesOrderStatusHistory> SalesOrderStatusHistories { get; set; }

        // =======================
        // INVENTORY / MATERIAL
        // =======================
        public DbSet<GoodsReceiving> GoodsReceivings { get; set; }
        public DbSet<GoodsReceivingItem> GoodsReceivingItems { get; set; }

        public DbSet<MaterialRequest> MaterialRequests { get; set; }
        public DbSet<MaterialItem> MaterialItems { get; set; }
        public DbSet<MaterialRequestStatusHistory> MaterialRequestStatusHistories { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        // =======================
        // FINANCE
        // =======================
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payments> Payments { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<Expense> Expenses { get; set; }

        //Setting
        public DbSet<TermsAndCondition> TermsAndConditions { get; set; }
        public DbSet<PaymentTerm> PaymentTerms { get; set; }
        public DbSet<ProductService> ProductServices { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =======================
            // SECURITY
            // =======================

            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.HasKey(ra => new { ra.Id });

            });

            modelBuilder.Entity<AccessPermission>(entity =>
            {
                entity.HasKey(ra => new { ra.Id });

            });

            // =======================
            // COMPANY
            // =======================
            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            });

           
            // =======================
            // DEPARTMENT
            // =======================
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.HasOne(d => d.Hod)
        .WithMany() // no collection in User
        .HasForeignKey(d => d.HodId)
        .OnDelete(DeleteBehavior.SetNull);
            });

            // =======================
            // PROJECT
            // =======================
            modelBuilder.Entity<ProjectMember>(entity =>
            {
                entity.HasKey(pm => new { pm.ProjectCode, pm.UserId });
            });

            modelBuilder.Entity<ProjectTask>()
    .HasOne(t => t.Project)
    .WithMany(p => p.ProjectTasks)
    .HasForeignKey(t => t.ProjectId)
    .OnDelete(DeleteBehavior.Restrict);

            // =======================
            // WORK ORDER
            // =======================
            modelBuilder.Entity<WorkOrder>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.WorkOrderNo).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<WorkOrderTask>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<WorkOrderAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // =======================
            // MATERIAL REQUEST
            // =======================
            modelBuilder.Entity<MaterialRequest>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.RequestNo).HasMaxLength(50);

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .HasDefaultValue("Draft");
            });

            modelBuilder.Entity<MaterialRequestStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<MaterialItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");

            });

            // =======================
            // DELIVERY ORDER
            // =======================
            modelBuilder.Entity<DeliveryOrder>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.DeliveryOrderNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Draft");
            });

            modelBuilder.Entity<DeliveryOrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.QuantityOrdered).HasColumnType("decimal(18,2)");
                entity.Property(e => e.QuantityDelivered).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<DORMAItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            });

            // =======================
            // FINANCE
            // =======================
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.InvoiceNo).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.Property(i => i.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Payments>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Expense>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ExpenseNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Income>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.IncomeNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            // =======================
            // QUOTATION & ITEMS
            // =======================
            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuotationNo).IsRequired().HasMaxLength(50);

                // Relationship to Items
                entity.HasMany(q => q.QuotationItems)
                      .WithOne(qi => qi.Quotation)
                      .HasForeignKey(qi => qi.QuotationId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<QuotationItems>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Fix: Column precision for financial data
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                entity.Property(e => e.RowType).HasMaxLength(20);
            });

            modelBuilder.Entity<QuotationStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(sh => sh.Quotation)
                      .WithMany(q => q.QuotationStatusHistories)
                      .HasForeignKey(sh => sh.QuotationId);
            });

            modelBuilder.Entity<ProductService>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasMany(x => x.Inventories)
                      .WithOne(x => x.ProductService)
                      .HasForeignKey(x => x.ProductServiceId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            ConfigureLeaveManagement(modelBuilder);
        }

        private static void ConfigureLeaveManagement(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasOne(u => u.Manager)
                    .WithMany(u => u.DirectReports)
                    .HasForeignKey(u => u.ManagerId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<UserReportingManager>(entity =>
            {
                entity.ToTable("UserReportingManagers");
                entity.HasKey(e => new { e.UserId, e.ManagerId });
                entity.HasOne(e => e.User)
                    .WithMany(u => u.ReportingManagers)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Manager)
                    .WithMany()
                    .HasForeignKey(e => e.ManagerId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => e.ManagerId);
            });

            modelBuilder.Entity<LeaveType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PolicyKind).HasConversion<string>().HasMaxLength(30);
                entity.Property(e => e.ApplicableGender).HasConversion<string>().HasMaxLength(20);
            });

            modelBuilder.Entity<LeaveBalance>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.EmployeeId, e.LeaveTypeId, e.Year }).IsUnique();
                entity.HasOne(e => e.Employee).WithMany().HasForeignKey(e => e.EmployeeId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.LeaveType).WithMany(t => t.LeaveBalances)
                    .HasForeignKey(e => e.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LeavePolicy>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.IsActive);
            });

            modelBuilder.Entity<LeaveTenureBand>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BandKind).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(e => e.LeavePolicy).WithMany(p => p.TenureBands)
                    .HasForeignKey(e => e.LeavePolicyId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LeaveYearClose>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ClosedYear).IsUnique();
            });

            modelBuilder.Entity<LeaveRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);
                entity.HasOne(e => e.Employee).WithMany().HasForeignKey(e => e.EmployeeId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.LeaveType).WithMany(t => t.LeaveRequests)
                    .HasForeignKey(e => e.LeaveTypeId).OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.Cancellation).WithOne(c => c.Request)
                    .HasForeignKey<LeaveCancellation>(c => c.RequestId);
                entity.HasOne(e => e.ConflictCheck).WithOne(c => c.Request)
                    .HasForeignKey<LeaveConflictCheck>(c => c.RequestId);
                entity.HasOne(e => e.BalanceCheck).WithOne(c => c.Request)
                    .HasForeignKey<LeaveBalanceCheckRecord>(c => c.RequestId);
                entity.HasOne(e => e.Appeal).WithOne(a => a.Request)
                    .HasForeignKey<LeaveAppeal>(a => a.RequestId);
            });

            modelBuilder.Entity<LeaveApproval>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Decision).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(e => e.Request).WithMany(r => r.Approvals)
                    .HasForeignKey(e => e.RequestId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Approver).WithMany().HasForeignKey(e => e.ApproverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<LeaveCancellation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            });

            modelBuilder.Entity<LeaveConflictCheck>(entity => entity.HasKey(e => e.Id));

            modelBuilder.Entity<LeaveBalanceCheckRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ActionTaken).HasConversion<string>().HasMaxLength(30);
            });

            modelBuilder.Entity<LeaveSupportingDocument>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.Request).WithMany(r => r.Documents)
                    .HasForeignKey(e => e.RequestId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LeaveAppeal>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Outcome).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(e => e.RaisedByUser).WithMany().HasForeignKey(e => e.RaisedBy)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.ReviewedByUser).WithMany().HasForeignKey(e => e.ReviewedBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<LeaveCalendarConnection>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Provider).HasConversion<string>().HasMaxLength(20);
                entity.HasIndex(e => new { e.UserId, e.Provider }).IsUnique();
                entity.HasIndex(e => e.RefreshTokenProtected);
                entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<LeaveCalendarEventMap>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ConnectionId, e.LeaveRequestId }).IsUnique();
                entity.HasOne(e => e.Connection).WithMany(c => c.EventMaps)
                    .HasForeignKey(e => e.ConnectionId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.LeaveRequest).WithMany()
                    .HasForeignKey(e => e.LeaveRequestId).OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}